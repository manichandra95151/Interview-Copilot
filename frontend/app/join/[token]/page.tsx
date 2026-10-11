"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useInterviewAudio } from "@/lib/hooks/useInterviewAudio";
import { VideoStage } from "@/components/interview/VideoStage";
import { Button, Spinner } from "@/components/ui";

type JoinInfo = {
  sessionId: string;
  candidateName: string;
  role: string;
  seniority?: string;
  scheduledAt?: string | null;
  status: string;
  requiresCode: boolean;
};

type MicState = "idle" | "checking" | "ready" | "denied";

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();

  const [info, setInfo] = useState<JoinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    api.getJoinInfo(token)
      .then((d: JoinInfo) => { setInfo(d); if (!d.requiresCode) setUnlocked(true); })
      .catch((e) => setError(e.message || "This link is invalid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  const verify = async () => {
    setVerifying(true);
    try {
      await api.verifyJoinCode(token, code.trim());
      setUnlocked(true);
    } catch {
      setCodeError("That code doesn't match. Check your invitation email.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <Center><Spinner size={28} /></Center>;
  }

  if (error) {
    return (
      <Center>
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[#FCECEC] text-red-500 flex items-center justify-center mx-auto mb-4 text-xl">!</div>
          <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Link not valid</h1>
          <p className="text-sm text-[#6A665E]">{error}</p>
        </div>
      </Center>
    );
  }

  const when = info?.scheduledAt
    ? new Date(info.scheduledAt).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-[#FBFAF7] flex flex-col">
      <header className="px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] brand-gradient flex items-center justify-center text-white font-black text-sm">C</div>
          <span className="font-semibold text-[#1A1A1A]">CopilotHire</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md scale-in">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.14em] mb-3">Interview invitation</p>
            <h1 className="text-[30px] font-semibold text-[#1A1A1A] tracking-tight leading-tight">
              Welcome, <span className="accent-serif">{info?.candidateName?.split(" ")[0] || "there"}</span>
            </h1>
            <p className="text-[#6A665E] text-sm mt-3">
              {info?.role}{info?.seniority ? ` · ${info.seniority}` : ""}
            </p>
            {when && <p className="text-[#9C978C] text-sm mt-1">{when}</p>}
          </div>

          {!unlocked ? (
            <div className="bg-white rounded-2xl border border-[#ECE8DF] p-6">
              <label className="block text-[13px] font-medium text-[#6A665E] mb-2 text-center">Enter your 6-digit access code</label>
              <input
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(""); }}
                onKeyDown={(e) => e.key === "Enter" && code.length >= 4 && verify()}
                inputMode="numeric"
                placeholder="••••••"
                className="w-full text-center text-2xl tracking-[0.4em] font-semibold px-4 py-3 rounded-xl border border-[#E0DBCF] bg-[#FBFAF7] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#4F46E5]"
                style={{ fontFamily: "var(--font-display)" }}
              />
              {codeError && <p className="text-xs text-red-500 mt-2 text-center">{codeError}</p>}
              <Button onClick={verify} loading={verifying} size="lg" className="w-full mt-4" disabled={code.length < 4}>
                Continue
              </Button>
            </div>
          ) : (
            <Lobby sessionId={info?.sessionId || null} joinToken={token} />
          )}

          <p className="text-center text-xs text-[#9C978C] mt-6">
            This is a voice interview conducted in your browser. Find a quiet spot.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Device check lobby → live ───────────────────────────── */
function Lobby({ sessionId, joinToken }: { sessionId: string | null; joinToken: string }) {
  const [mic, setMic] = useState<MicState>("idle");
  const [level, setLevel] = useState(0);
  const [joined, setJoined] = useState(false);
  const [lk, setLk] = useState<{ token: string; url: string } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const audio = useInterviewAudio({ sessionId, role: "candidate", joinToken });

  const join = async () => {
    // Release the device-check stream; the live pipeline captures from here.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setJoined(true);
    try {
      const res = await api.getLivekitJoinToken(joinToken);
      setLk(res); // video call; transcription fed from the LiveKit mic track
    } catch {
      audio.startMic(); // video not configured → audio-only transcription
    }
  };

  const startMicCheck = async () => {
    setMic("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMic("ready");

      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
        setLevel(Math.min(100, Math.round((peak / 128) * 180)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setMic("denied");
    }
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ── Live state ──
  if (joined) {
    // Video call (LiveKit) — transcription is fed from the LiveKit mic track.
    if (lk) {
      return (
        <div className="bg-[#111] rounded-2xl border border-[#ECE8DF] overflow-hidden h-[460px]">
          <VideoStage url={lk.url} token={lk.token} onLocalMicTrack={(t) => audio.startMic(t)} />
        </div>
      );
    }
    // Audio-only fallback (video not configured)
    return (
      <div className="bg-white rounded-2xl border border-[#ECE8DF] p-6 text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <span className="absolute inset-0 rounded-full bg-[#4F46E5]/15 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#4F46E5]">
            <MicIcon />
          </div>
        </div>
        <h2 className="font-semibold text-[#1A1A1A] mb-1">You&apos;re live</h2>
        <p className="text-sm text-[#6A665E]">
          {audio.error
            ? audio.error
            : "Your interviewer will guide the conversation. Speak naturally — just answer their questions."}
        </p>
        <div className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#4F46E5] bg-[#EEF0FF] px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full rec-pulse" />
          {audio.micOn ? "Microphone on" : "Connecting…"}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ECE8DF] p-6">
      <h2 className="font-semibold text-[#1A1A1A] mb-1">Check your microphone</h2>
      <p className="text-sm text-[#6A665E] mb-5">Make sure we can hear you before you begin.</p>

      {mic === "idle" && (
        <Button onClick={startMicCheck} variant="secondary" className="w-full">
          <MicIcon /> Test microphone
        </Button>
      )}

      {mic === "checking" && (
        <div className="flex items-center gap-2 text-sm text-[#6A665E] justify-center py-3"><Spinner size={16} /> Requesting access…</div>
      )}

      {mic === "ready" && (
        <div>
          <div className="flex items-center gap-2 text-sm text-green-700 mb-3">
            <span className="w-5 h-5 rounded-full bg-[#E9F7EF] flex items-center justify-center text-xs">✓</span>
            Microphone is working
          </div>
          <div className="flex items-center gap-1 h-10">
            {Array.from({ length: 24 }).map((_, i) => {
              const active = (i / 24) * 100 < level;
              return <span key={i} className={`flex-1 rounded-full transition-all ${active ? "bg-[#4F46E5]" : "bg-[#ECE8DF]"}`} style={{ height: active ? `${30 + (i % 6) * 10}%` : "20%" }} />;
            })}
          </div>
        </div>
      )}

      {mic === "denied" && (
        <div className="text-sm text-red-600 bg-[#FCECEC] rounded-xl p-3">
          Microphone access was blocked. Enable it in your browser settings, then reload this page.
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-[#F1EEE6]">
        <div className="flex items-start gap-2.5 text-xs text-[#9C978C] mb-4">
          <span className="text-[#4F46E5] mt-0.5">ⓘ</span>
          <span>Your interviewer will start the session. Keep this tab open — the live interview begins here.</span>
        </div>
        <Button size="lg" className="w-full" disabled={mic !== "ready"} onClick={join}>
          {mic === "ready" ? "Join the interview →" : "Test your mic to continue"}
        </Button>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FBFAF7] flex items-center justify-center px-5">{children}</div>;
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
    </svg>
  );
}
