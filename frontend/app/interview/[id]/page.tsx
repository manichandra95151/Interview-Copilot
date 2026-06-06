"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

type Q = { id: number; question: string; category: string; rubric: string; timeGuide?: string };
type Eval = { score: number | null; strength: string | null; gap: string | null; followUp: string | null; sentiment: string; analysis?: string };
type AnswerState = { transcript: string; evaluation: Eval | null; loading: boolean; done: boolean; skipped: boolean; notAnswered?: boolean; notes?: string };

const CAT_COLOR: Record<string, string> = {
  behavioral:  "bg-blue-50 text-blue-700 border-blue-200",
  situational: "bg-violet-50 text-violet-700 border-violet-200",
  experience:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  technical:   "bg-orange-50 text-orange-700 border-orange-200",
  culture:     "bg-pink-50 text-pink-700 border-pink-200",
  leadership:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "follow-up": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

function ScoreRing({ score, size = 56 }: { score: number | null; size?: number }) {
  if (score === null) return null;
  const r = 22, circ = 2 * Math.PI * r;
  const pct = score / 10;
  const color = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626";
  const bg    = score >= 8 ? "#f0fdf4" : score >= 6 ? "#fffbeb" : "#fef2f2";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill={bg} stroke="#E2E8F0" strokeWidth="3.5"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform="rotate(-90 28 28)"
          className="anim-ring-draw" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}/>
        <text x="28" y="33" textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{score}</text>
      </svg>
    </div>
  );
}

function LoadingOverlay({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_8px_32px_rgba(15,23,42,0.08)] anim-scale-in">
        <div className="relative w-14 h-14 mx-auto mb-5">
          <svg className="w-14 h-14 anim-spin" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="24" stroke="#E2E8F0" strokeWidth="4"/>
            <path d="M28 4a24 24 0 0124 24" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="font-bold text-[#0F172A] text-sm mb-1">{title}</h3>
        <p className="text-xs text-[#94A3B8]">{subtitle}</p>
      </div>
    </div>
  );
}

export default function InterviewPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?._token;

  const [sessionData, setSessionData] = useState<any>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [editTranscript, setEditTranscript] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showRubric, setShowRubric] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const currentQ = questions[currentIdx];
  const currentAns = currentQ ? answers[currentQ.id] : null;
  const answeredCount = Object.values(answers).filter(a => a.done || a.skipped).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getSession(sessionId, token), api.getQuestions(sessionId, token)])
      .then(([s, q]) => {
        setSessionData(s);
        setQuestions(q.questions || []);
        if (s.answers && Array.isArray(s.answers)) {
          const ansMap: Record<number, AnswerState> = {};
          s.answers.forEach((a: any) => {
            ansMap[a.question_id] = {
              transcript: a.transcript || "",
              evaluation: { score: a.score, strength: a.strength, gap: a.gap, followUp: a.followUp, sentiment: a.sentiment, analysis: a.analysis },
              loading: false, done: !a.skipped, skipped: a.skipped,
              notAnswered: a.sentiment === "not_answered" || a.score === 0,
              notes: a.manual_notes || ""
            };
          });
          setAnswers(ansMap);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, token]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (currentQ) {
      const ans = answers[currentQ.id];
      setEditTranscript(ans?.transcript || "");
      setNotes(ans?.notes || "");
    } else { setEditTranscript(""); setNotes(""); }
  }, [currentQ?.id]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startRec = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice recording requires Chrome or Edge."); return; }
    const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: any) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setEditTranscript(t); };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start(); recognitionRef.current = rec;
    setEditTranscript(""); setRecording(true);
  }, []);

  const stopRec = useCallback(() => { recognitionRef.current?.stop(); setRecording(false); }, []);

  const evaluate = async (notAnswered = false) => {
    if (!currentQ) return;
    const qId = currentQ.id;
    setAnswers(p => ({ ...p, [qId]: { transcript: editTranscript, evaluation: null, loading: true, done: false, skipped: false, notAnswered, notes } }));
    try {
      const ev = await api.evaluateAnswer(sessionId, qId, editTranscript, notes, notAnswered, token);
      setAnswers(p => ({ ...p, [qId]: { transcript: editTranscript, evaluation: ev, loading: false, done: true, skipped: false, notAnswered, notes } }));
      setShowNotes(false); setShowRubric(false);
    } catch (e: any) {
      setAnswers(p => ({ ...p, [qId]: { transcript: editTranscript, evaluation: null, loading: false, done: false, skipped: false, notes } }));
      setError(e.message);
    }
  };

  const skip = async () => {
    if (!currentQ) return;
    await api.skipQuestion(sessionId, currentQ.id, token);
    setAnswers(p => ({ ...p, [currentQ.id]: { transcript: "", evaluation: null, loading: false, done: false, skipped: true } }));
    setEditTranscript(""); setShowRubric(false);
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
  };

  const goNext = () => { if (currentIdx < questions.length - 1) { setCurrentIdx(i => i + 1); setShowRubric(false); } };
  const goPrev = () => { if (currentIdx > 0) { setCurrentIdx(i => i - 1); setShowRubric(false); } };

  const finish = async () => {
    setFinishing(true);
    try { await api.generateReport(sessionId, token); router.push(`/report/${sessionId}`); }
    catch (e: any) { setError(e.message); setFinishing(false); }
  };

  if (loading) return <LoadingOverlay title="Initializing Workspace" subtitle="Calibrating interview parameters..."/>;
  if (finishing) return <LoadingOverlay title="Compiling Dossier" subtitle="Assembling report parameters..."/>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">

      {/* ── TOP BAR ── */}
      <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-5 flex items-center justify-between h-14">
          {/* Logo + candidate */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span className="font-bold text-[#0F172A] text-[15px]">CopilotHire</span>
            </Link>
            <div className="h-5 w-px bg-[#E2E8F0] mx-1"/>
            <div className="hidden sm:flex items-center gap-5 text-[13px] font-medium">
              <Link href="/dashboard" className="text-[#475569] hover:text-[#0F172A] transition">Dashboard</Link>
              <span className="text-[#1D4ED8] border-b-2 border-[#1D4ED8] pb-0.5">Interviews</span>
            </div>
          </div>

          {/* Center progress */}
          <div className="flex-1 max-w-xs hidden md:block mx-8">
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-semibold mb-1.5">
              <span>{answeredCount}/{questions.length} completed</span>
              <span className="font-mono">{fmt(elapsed)}</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}/>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            {answeredCount >= 1 && (
              <button onClick={finish}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-[0.97] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white dot-blink"/>
                End Session
              </button>
            )}
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold">
              {sessionData?.candidate_name?.charAt(0) || "?"}
            </div>
          </div>
        </div>
      </nav>

      {/* ── THREE-COLUMN LAYOUT ── */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full overflow-hidden">

        {/* ── LEFT SIDEBAR: Evaluation Queue ── */}
        <div className="w-[270px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col">
          <div className="px-4 py-3.5 border-b border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Evaluation Queue</span>
            <span className="text-[10px] font-bold text-white bg-[#1D4ED8] px-2 py-0.5 rounded-full">{questions.length} TOTAL</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F8FAFC]">
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const isCurrent = i === currentIdx;
              const score = ans?.evaluation?.score;
              return (
                <button key={q.id} onClick={() => { setCurrentIdx(i); setShowRubric(false); }}
                  className={`w-full text-left p-4 transition-all border-l-[3px] ${
                    isCurrent
                      ? "bg-[#EFF6FF] border-[#1D4ED8]"
                      : "border-transparent hover:bg-[#F8FAFC]"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                      ans?.skipped     ? "bg-[#F1F5F9] text-[#94A3B8]" :
                      ans?.notAnswered ? "bg-red-50 text-red-500" :
                      ans?.done && (score || 0) >= 8 ? "bg-green-50 text-green-700 border border-green-200" :
                      ans?.done && (score || 0) >= 6 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      ans?.done        ? "bg-red-50 text-red-600 border border-red-200" :
                      isCurrent        ? "bg-[#1D4ED8] text-white" :
                                         "bg-[#F1F5F9] text-[#94A3B8]"
                    }`}>
                      {isCurrent && !ans?.done ? "●" : ans?.skipped ? "—" : ans?.notAnswered ? "✕" : ans?.done ? (score ?? "✓") : String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isCurrent && (
                        <span className="text-[9px] font-bold text-[#1D4ED8] bg-[#DBEAFE] px-1.5 py-0.5 rounded uppercase tracking-wide mb-1 inline-block">
                          ACTIVE
                        </span>
                      )}
                      <p className={`text-[12px] font-semibold leading-snug line-clamp-2 ${isCurrent ? "text-[#0F172A]" : "text-[#475569]"}`}>
                        {q.question.length > 60 ? q.question.slice(0, 58) + "…" : q.question}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] mt-1 font-medium capitalize">{q.category}</p>
                      {isCurrent && (
                        <p className="text-[10px] font-mono text-[#94A3B8] mt-0.5">{fmt(elapsed)}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            <button onClick={() => {}} className="w-full p-4 flex items-center gap-2 text-[12px] font-semibold text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8FAFC] transition border-l-[3px] border-transparent">
              <span className="w-6 h-6 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] text-sm font-bold">+</span>
              Add Question
            </button>
          </div>

          {/* Candidate card at bottom */}
          {sessionData && (
            <div className="px-4 py-3.5 border-t border-[#E2E8F0] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {sessionData.candidate_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0F172A] truncate">{sessionData.candidate_name}</p>
                <p className="text-[11px] text-[#94A3B8] truncate">{sessionData.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER: Active Probe + Answer ── */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-4 min-w-0">
          {currentQ ? (
            <>
              {/* Active Probe Card */}
              <div className="card p-6 anim-fade-up">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><circle cx="6" cy="6" r="5" stroke="#1D4ED8" strokeWidth="1.2"/><path d="M6 4v2.5m0 1.5v.1" stroke="#1D4ED8" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </div>
                  <span className="text-[11px] font-bold text-[#1D4ED8] uppercase tracking-wider">Active Probe</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button onClick={goPrev} disabled={currentIdx === 0}
                      className="text-xs px-2 py-1 rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-30 transition font-semibold">
                      ←
                    </button>
                    <span className="text-[11px] text-[#94A3B8] font-mono">{currentIdx + 1}/{questions.length}</span>
                    <button onClick={goNext} disabled={currentIdx === questions.length - 1}
                      className="text-xs px-2 py-1 rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-30 transition font-semibold">
                      →
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-[#0F172A] leading-snug mb-4">
                  "{currentQ.question}"
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${CAT_COLOR[currentQ.category] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {currentQ.category}
                  </span>
                  {currentQ.timeGuide && (
                    <span className="text-[11px] text-[#94A3B8] font-medium">⏱ {currentQ.timeGuide}</span>
                  )}
                  <button onClick={() => setShowRubric(!showRubric)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-2.5 py-1 hover:bg-blue-100 transition">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 4l4 3 4-3" stroke="#1D4ED8" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Look for: {showRubric ? "Hide guide" : "Show guide"}
                  </button>
                </div>

                {showRubric && (
                  <div className="mt-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 anim-fade-in">
                    <p className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider mb-2">Grading Criteria</p>
                    <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap">{currentQ.rubric}</p>
                  </div>
                )}
              </div>

              {/* Candidate Answer + Transcript */}
              <div className="card flex-1 flex flex-col anim-fade-up-1">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#0F172A]">Candidate Answer</span>
                    {recording && (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-500">
                        <span className="w-2 h-2 bg-red-500 rounded-full listen-pulse"/>
                        LIVE
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowNotes(!showNotes)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition border border-[#E2E8F0] px-3 py-1.5 rounded-lg hover:bg-[#F8FAFC]">
                    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M2 2h8a1 1 0 011 1v6a1 1 0 01-1 1H5L2 13V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/></svg>
                    {showNotes ? "Hide Notes" : "Add Notes"}
                  </button>
                </div>

                {/* Transcript area with grid texture */}
                <div className="flex-1 relative min-h-[220px]">
                  {recording && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white border border-red-200 px-2.5 py-1 rounded-full shadow-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full listen-pulse"/>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Listening</span>
                    </div>
                  )}
                  <textarea
                    value={editTranscript}
                    onChange={e => setEditTranscript(e.target.value)}
                    rows={8}
                    placeholder={recording
                      ? "Transcribing live audio..."
                      : "\"Paste or transcribe the candidate's response here. Click Record Answer to use live speech-to-text...\""
                    }
                    disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                    className={`w-full h-full min-h-[220px] px-5 py-4 text-sm font-medium leading-relaxed text-[#0F172A] placeholder:text-[#CBD5E1] resize-none focus:outline-none grid-texture transition-colors ${
                      recording ? "bg-red-50/30 placeholder:text-red-300" :
                      (currentAns?.done || currentAns?.skipped || currentAns?.notAnswered) ? "bg-[#F8FAFC] text-[#94A3B8]" :
                      "bg-white"
                    }`}
                    style={{ fontStyle: editTranscript ? "normal" : "italic" }}
                  />
                  {recording && (
                    <p className="absolute bottom-4 left-5 text-xs text-[#94A3B8] italic">
                      Candidate is continuing to explain...
                      <span className="caret-blink">|</span>
                    </p>
                  )}
                </div>

                {showNotes && (
                  <div className="border-t border-[#F1F5F9] px-5 py-3">
                    <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">Interviewer Notes (Private)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder="Add private observations..."
                      disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                      className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] resize-none focus:outline-none focus:ring-1 focus:ring-[#1D4ED8] bg-[#F8FAFC]"/>
                  </div>
                )}

                {/* Bottom action bar */}
                <div className="border-t border-[#F1F5F9] px-5 py-4 flex items-center gap-3 bg-[#F8FAFC] rounded-b-xl">
                  {recording ? (
                    <div className="flex items-center gap-2 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg">
                      <span className="w-2 h-2 bg-white rounded-full dot-blink"/>
                      LISTENING
                      <span className="font-mono ml-1">{fmt(elapsed)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-mono border border-[#E2E8F0] px-3 py-2 rounded-lg bg-white">
                      {fmt(elapsed)}
                    </div>
                  )}

                  <button onClick={() => {}} className="w-9 h-9 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center text-[#94A3B8] hover:text-[#475569] hover:bg-[#F8FAFC] transition">
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>

                  <button onClick={skip} disabled={!!currentAns?.done}
                    className="text-xs font-semibold text-[#94A3B8] hover:text-[#475569] transition px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-[#E2E8F0] disabled:opacity-40">
                    Skip
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    {!editTranscript.trim() && !currentAns?.done && !recording && (
                      <button onClick={() => evaluate(true)}
                        className="text-amber-600 text-xs font-bold px-3 py-2 hover:text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition">
                        Mark Unanswered
                      </button>
                    )}

                    {editTranscript.trim() && !currentAns?.done && (
                      <button onClick={() => evaluate(false)} disabled={currentAns?.loading}
                        className="bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold px-5 py-2 rounded-lg transition active:scale-[0.97] disabled:opacity-50 shadow-sm">
                        {currentAns?.loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full anim-spin"/>
                            Analyzing...
                          </span>
                        ) : "Evaluate ✓"}
                      </button>
                    )}

                    <button onClick={recording ? stopRec : startRec}
                      disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                      className={`flex items-center gap-2 text-sm font-bold px-5 py-2 rounded-lg transition active:scale-[0.97] disabled:opacity-30 ${
                        recording
                          ? "bg-white text-red-500 border border-red-200 hover:bg-red-50"
                          : "bg-[#0F172A] text-white hover:bg-[#1e293b]"
                      }`}>
                      {recording ? (
                        <><span className="w-3 h-3 rounded bg-red-500"/>Stop</>
                      ) : (
                        <>
                          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="3" fill="white"/><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.2"/></svg>
                          Record Answer →
                        </>
                      )}
                    </button>
                  </div>

                  {currentAns?.done && currentIdx < questions.length - 1 && (
                    <button onClick={goNext} className="bg-[#1D4ED8] text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-[#1E40AF] transition">
                      Next →
                    </button>
                  )}
                </div>

                {error && <p className="text-red-500 text-xs px-5 pb-3 font-semibold">⚠ {error}</p>}
              </div>

              {/* All done banner */}
              {answeredCount === questions.length && questions.length > 0 && (
                <div className="card p-5 text-center border-green-200 bg-green-50 anim-scale-in">
                  <p className="text-sm font-bold text-green-900 mb-1">All questions evaluated!</p>
                  <p className="text-xs text-green-600 mb-4">Compile the structured report dossier.</p>
                  <button onClick={finish} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition shadow-sm">
                    Compile Assessment Dossier →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#94A3B8]">No questions loaded.</div>
          )}
        </div>

        {/* ── RIGHT PANEL: Calibrated Verdict ── */}
        <div className="w-[300px] shrink-0 border-l border-[#E2E8F0] bg-white overflow-y-auto flex flex-col">

          {/* Verdict header */}
          <div className="p-5 border-b border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[#475569]"><path d="M2 12l4-8 4 8M4 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <span className="font-bold text-[#0F172A] text-sm">Calibrated Verdict</span>
              </div>
              {currentAns?.evaluation?.score != null && (
                <ScoreRing score={currentAns.evaluation.score}/>
              )}
            </div>

            {currentAns?.evaluation && (
              <div>
                <p className="text-sm font-bold text-[#475569] italic capitalize mb-3">
                  {currentAns.evaluation.sentiment === "not_answered" ? "Not Answered" : (currentAns.evaluation.sentiment || "Neutral") + " Response"}
                </p>
                {currentAns.evaluation.score != null && (
                  <div className="space-y-2.5">
                    {[
                      { label: "Technical Depth",    val: Math.round((currentAns.evaluation.score / 10) * 9.0 * 10) / 10 },
                      { label: "Communication",       val: Math.round((currentAns.evaluation.score / 10) * 7.5 * 10) / 10 },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#475569] font-medium">{m.label}</span>
                          <span className="font-bold text-[#0F172A]">{m.val}</span>
                        </div>
                        <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D4ED8] rounded-full anim-bar-fill" style={{ width: `${(m.val / 10) * 100}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentAns?.loading && (
              <div className="flex items-center gap-2.5 text-[#1D4ED8] py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#1D4ED8] rounded-full bounce-dot-1"/>
                  <span className="w-2 h-2 bg-[#1D4ED8] rounded-full bounce-dot-2"/>
                  <span className="w-2 h-2 bg-[#1D4ED8] rounded-full bounce-dot-3"/>
                </div>
                <p className="text-xs font-bold">AI Evaluating...</p>
              </div>
            )}

            {!currentAns?.done && !currentAns?.loading && (
              <p className="text-xs text-[#94A3B8] italic">Submit an answer to see the AI verdict.</p>
            )}
          </div>

          {/* Feedback Analysis */}
          {currentAns?.evaluation?.analysis && (
            <div className="p-4 border-b border-[#F1F5F9]">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Feedback Analysis</p>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#475569] leading-relaxed">
                "{currentAns.evaluation.analysis}"
              </div>
            </div>
          )}

          {/* Key Strengths */}
          {currentAns?.evaluation?.strength && (
            <div className="p-4 border-b border-[#F1F5F9]">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">Key Strengths</p>
              <div className="space-y-1.5">
                {currentAns.evaluation.strength.split(".").filter(s => s.trim()).map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-green-700">
                    <span className="text-green-500 mt-0.5 shrink-0">•</span>
                    <span className="leading-relaxed">{s.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Gaps */}
          {currentAns?.evaluation?.gap && (
            <div className="p-4 border-b border-[#F1F5F9]">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Performance Gaps</p>
              <p className="text-xs text-amber-700 leading-relaxed">{currentAns.evaluation.gap}</p>
            </div>
          )}

          {/* Follow-up Probes */}
          {currentAns?.evaluation?.followUp && (
            <div className="p-4 border-b border-[#F1F5F9]">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Follow-up Probes</p>
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 mb-2">
                <p className="text-xs text-[#1D4ED8] leading-relaxed font-medium">"{currentAns.evaluation.followUp}"</p>
              </div>
              <button
                onClick={async () => {
                  if (!token || !currentAns?.evaluation?.followUp) return;
                  try {
                    const newQ = await api.addQuestion(sessionId, currentAns.evaluation!.followUp!, "follow-up", `Follow-up to Q${currentIdx + 1}`, token);
                    setQuestions(prev => { const u = [...prev]; u.splice(currentIdx + 1, 0, newQ); return u; });
                    setCurrentIdx(currentIdx + 1); setShowRubric(false);
                  } catch (err: any) { setError("Failed to add follow-up: " + err.message); }
                }}
                className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold py-2 rounded-lg transition active:scale-[0.97]">
                Ask this follow-up →
              </button>
            </div>
          )}

          {currentAns?.skipped && (
            <div className="p-4 border-b border-[#F1F5F9] text-center">
              <p className="text-xs font-semibold text-[#94A3B8]">⏭ Question skipped</p>
            </div>
          )}

          {/* Metrics Scoreboard */}
          {Object.values(answers).some(a => a.done) && (
            <div className="p-4">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Metrics Scoreboard</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(() => {
                  const scored = Object.values(answers).filter(a => a.done && a.evaluation?.score != null && !a.notAnswered);
                  const avg = scored.length ? scored.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0) / scored.length : 0;
                  return (
                    <>
                      <div className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] font-semibold mb-1">TIME SCORE</p>
                        <p className="text-xl font-black text-[#0F172A]">{avg.toFixed(1)}</p>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-xl p-3 text-center border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] font-semibold mb-1">ACCURACY</p>
                        <p className="text-xl font-black text-[#0F172A]">{scored.length > 0 ? Math.round(avg * 10) : 0}%</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-2.5">
                {questions.map((q, i) => {
                  const a = answers[q.id];
                  if (!a?.done) return null;
                  const s = a.evaluation?.score ?? 0;
                  return (
                    <div key={q.id} className="flex items-center gap-2.5">
                      <span className="text-[10px] text-[#94A3B8] font-bold w-6 shrink-0">Q{i + 1}</span>
                      <div className="flex-1 bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full anim-bar-fill ${s >= 8 ? "bg-green-500" : s >= 6 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${s * 10}%`, animationDelay: `${i * 60}ms` }}/>
                      </div>
                      <span className="text-[10px] font-bold text-[#475569] min-w-[20px] text-right">{a.notAnswered ? "✕" : s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}