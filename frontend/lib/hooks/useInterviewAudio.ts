"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Insight = {
  activeQuestion?: string;
  questionSource?: string;
  score: number;
  strength: string;
  gap: string;
  followUp: string;
  sentiment: string;
};

export type Turn = { role: "interviewer" | "candidate"; text: string };

type Status = "idle" | "connecting" | "ready" | "error";
type Role = "interviewer" | "candidate";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

/**
 * Live two-way interview audio. Connects to the session room as either the
 * interviewer or the candidate, streams this device's mic, and (for the
 * interviewer) exposes the labeled conversation + real-time AI insight.
 */
export function useInterviewAudio(opts: {
  sessionId: string | null;
  role: Role;
  token?: string | null;
  joinToken?: string | null;
}) {
  const { sessionId, role, token, joinToken } = opts;

  const [status, setStatus] = useState<Status>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [interim, setInterim] = useState<{ interviewer: string; candidate: string }>({ interviewer: "", candidate: "" });
  const [insight, setInsight] = useState<Insight | null>(null);
  const [candidateConnected, setCandidateConnected] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [error, setError] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const plannedRef = useRef<string | null>(null);

  const canConnect = !!sessionId && (role === "interviewer" ? !!token : !!joinToken);

  const appendTurn = useCallback((r: Turn["role"], text: string) => {
    setTurns((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === r) {
        const copy = prev.slice();
        copy[copy.length - 1] = { role: r, text: last.text + " " + text };
        return copy;
      }
      return [...prev, { role: r, text }];
    });
  }, []);

  useEffect(() => {
    if (!canConnect || wsRef.current) return;
    setStatus("connecting");
    const auth = role === "interviewer" ? `token=${encodeURIComponent(token!)}` : `joinToken=${encodeURIComponent(joinToken!)}`;
    const ws = new WebSocket(`${WS_BASE}/ws/interview?sessionId=${sessionId}&role=${role}&${auth}`);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (e) => {
      let msg: any;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type === "ready") {
        setStatus("ready");
      } else if (msg.type === "transcript") {
        if (msg.isFinal) {
          appendTurn(msg.role, msg.text);
          setInterim((p) => ({ ...p, [msg.role]: "" }));
        } else {
          setInterim((p) => ({ ...p, [msg.role]: msg.text }));
        }
      } else if (msg.type === "insight") {
        setInsight({
          activeQuestion: msg.activeQuestion, questionSource: msg.questionSource,
          score: msg.score, strength: msg.strength, gap: msg.gap, followUp: msg.followUp, sentiment: msg.sentiment,
        });
      } else if (msg.type === "peer") {
        if (msg.role === "candidate") setCandidateConnected(msg.connected);
      } else if (msg.type === "error") {
        setError(msg.message === "stt_unconfigured"
          ? "Live transcription isn't configured (no Deepgram key)."
          : "Transcription error.");
      }
    };
    ws.onerror = () => { setError("Couldn't reach the live service."); setStatus("error"); };
    ws.onclose = () => { wsRef.current = null; };

    return () => {
      recorderRef.current?.state === "recording" && recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canConnect, sessionId, role, token, joinToken]);

  /**
   * Start streaming mic audio to the transcription backend.
   * Pass an external track (e.g. the LiveKit local mic) to reuse one capture
   * for both the video call and transcription; otherwise we getUserMedia.
   */
  const startMic = useCallback(async (externalTrack?: MediaStreamTrack) => {
    setError("");
    try {
      let stream: MediaStream;
      if (externalTrack) {
        stream = new MediaStream([externalTrack]);
        streamRef.current = null; // owned by LiveKit — don't stop it on stopMic
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
      }
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      wsRef.current?.send(JSON.stringify({ type: "start", plannedQuestion: plannedRef.current }));
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(ev.data);
      };
      rec.start(250);
      setMicOn(true);
    } catch {
      setError("Microphone access was blocked. Enable it in your browser settings.");
      setStatus("error");
    }
  }, []);

  const stopMic = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: "stop" }));
    setMicOn(false);
  }, []);

  const setPlanned = useCallback((question: string | null) => {
    plannedRef.current = question;
    wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: "planned", question }));
  }, []);

  const requestInsight = useCallback(() => {
    wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: "insight_now" }));
  }, []);

  /** Candidate's finalized speech, concatenated — used to fill the answer field. */
  const candidateText = turns.filter((t) => t.role === "candidate").map((t) => t.text).join(" ");

  return {
    status, turns, interim, insight, candidateConnected, micOn, error, candidateText,
    startMic, stopMic, setPlanned, requestInsight,
  };
}
