"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

type Q = { id: number; question: string; category: string; rubric: string; timeGuide?: string };
type Eval = { score: number | null; strength: string | null; gap: string | null; followUp: string | null; sentiment: string; analysis?: string };
type AnswerState = { transcript: string; evaluation: Eval | null; loading: boolean; done: boolean; skipped: boolean; notAnswered?: boolean; notes?: string };

const CAT_STYLE: Record<string, string> = {
  behavioral:  "bg-blue-50 text-blue-700 border-blue-200",
  situational: "bg-purple-50 text-purple-700 border-purple-200",
  experience:  "bg-green-50 text-green-700 border-green-200",
  technical:   "bg-orange-50 text-orange-700 border-orange-200",
  culture:     "bg-pink-50 text-pink-700 border-pink-200",
  leadership:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "follow-up": "bg-cyan-50 text-cyan-700 border-cyan-200",
};

function ScoreRing({ score, size = 52 }: { score: number | null; size?: number }) {
  if (score === null) return null;
  const r = 20, circ = 2 * Math.PI * r;
  const color = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626";
  const bg    = score >= 8 ? "#f0fdf4" : score >= 6 ? "#fffbeb" : "#fef2f2";
  return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill={bg} stroke="#f3f4f6" strokeWidth="3.5"/>
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 10)}
        strokeLinecap="round" transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1)" }}/>
      <text x="26" y="30" textAnchor="middle" fontSize="12" fontWeight="800" fill={color}>{score}</text>
    </svg>
  );
}

function Loader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="bg-white rounded-3xl border border-[#EDE9FF] p-8 max-w-sm w-full text-center shadow-xl shadow-purple-50/60 scale-in">
        <div className="relative w-14 h-14 mx-auto mb-5">
          <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="23" stroke="#EDE9FF" strokeWidth="4"/>
            <circle cx="28" cy="28" r="23" stroke="url(#lg2)" strokeWidth="4"
              strokeDasharray="144" strokeDashoffset="36" strokeLinecap="round"
              transform="rotate(-90 28 28)" className="spin"/>
            <defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6C47FF"/><stop offset="100%" stopColor="#EC4899"/></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-gray-400 text-xs">{subtitle}</p>
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
  const [addingQ, setAddingQ] = useState(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  const currentQ = questions[currentIdx];
  const currentAns = currentQ ? answers[currentQ.id] : null;
  const answeredCount = Object.values(answers).filter(a => a.done || a.skipped).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
      setShowRubric(false);
      setShowNotes(false);
    }
  }, [currentQ?.id]);

  const startRec = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice recording requires Chrome or Edge browser."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setEditTranscript(t);
    };
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
      if (currentIdx < questions.length - 1) setTimeout(() => setCurrentIdx(i => i + 1), 800);
    } catch (e: any) {
      setAnswers(p => ({ ...p, [qId]: { ...p[qId], loading: false, done: false } }));
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

  const goNext = () => { if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1); };
  const goPrev = () => { if (currentIdx > 0) setCurrentIdx(i => i - 1); };

  const finish = async () => {
    setFinishing(true);
    try { await api.generateReport(sessionId, token); router.push(`/report/${sessionId}`); }
    catch (e: any) { setError(e.message); setFinishing(false); }
  };

  const addFollowUp = async (followUpText: string) => {
    if (!token || addingQ) return;
    setAddingQ(true);
    try {
      const newQ = await api.addQuestion(sessionId, followUpText, "follow-up", `Follow-up to Q${currentIdx + 1}: "${currentQ?.question}"`, token);
      setQuestions(prev => { const u = [...prev]; u.splice(currentIdx + 1, 0, newQ); return u; });
      setCurrentIdx(currentIdx + 1);
    } catch (err: any) { setError("Failed to add follow-up: " + err.message); }
    finally { setAddingQ(false); }
  };

  if (loading) return <Loader title="Initializing Workspace" subtitle="Calibrating interview parameters..."/>;
  if (finishing) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="bg-white rounded-3xl border border-[#EDE9FF] p-8 max-w-sm w-full text-center shadow-xl shadow-purple-50 scale-in">
        <div className="relative w-14 h-14 mx-auto mb-5">
          <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="23" stroke="#EDE9FF" strokeWidth="4"/>
            <circle cx="28" cy="28" r="23" stroke="url(#lgf)" strokeWidth="4"
              strokeDasharray="144" strokeDashoffset="36" strokeLinecap="round"
              transform="rotate(-90 28 28)" className="spin"/>
            <defs><linearGradient id="lgf" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6C47FF"/><stop offset="100%" stopColor="#EC4899"/></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
          </div>
        </div>
        <h2 className="text-sm font-bold text-gray-900 mb-1">Compiling Assessment Dossier</h2>
        <p className="text-gray-400 text-xs mb-5">Synthesizing evaluation data...</p>
        <div className="text-left space-y-2.5 border-t border-gray-100 pt-4">
          {[
            { l:"Aggregating transcripts",          s:"done" },
            { l:"Scoring competency structures",    s:"done" },
            { l:"Synthesizing overall assessment",  s:"active" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              {item.s==="done" ? <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
              : <span className="w-4 h-4 rounded-full border-2 border-[#6C47FF] border-t-transparent spin shrink-0"/>}
              <span className={item.s==="active"?"text-gray-900 font-bold":"text-gray-400"}>{item.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const isLocked = !!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading);

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">

      {/* ── TOP BAR ── */}
      <nav className="bg-white border-b border-[#EDE9FF]/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1360px] mx-auto px-4 flex items-center justify-between h-14 gap-4">
          {/* Left: logo + candidate */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white font-black text-xs">C</div>
              <span className="hidden sm:block font-bold text-gray-900 text-[13px]">CopilotHire</span>
            </Link>
            <div className="h-4 w-px bg-gray-200 hidden sm:block"/>
            <div className="hidden sm:flex items-center gap-4 text-[12px] font-medium">
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-900 transition">Dashboard</Link>
              <span className="text-[#6C47FF] border-b-2 border-[#6C47FF] pb-0.5">Interviews</span>
            </div>
          </div>

          {/* Center: progress */}
          <div className="flex-1 max-w-xs hidden md:block">
            <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1.5">
              <span>{answeredCount}/{questions.length} completed</span>
              <span className="font-mono">{fmt(elapsed)}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#6C47FF] h-1.5 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}/>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {answeredCount >= 1 && (
              <button onClick={finish}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm active:scale-[0.97]">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60"/>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"/>
                </span>
                <span className="hidden sm:block">End Session</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-black shrink-0">
              {sessionData?.candidate_name?.charAt(0) || "?"}
            </div>
          </div>
        </div>
      </nav>

      {/* ── THREE COLUMNS ── */}
      <div className="flex-1 flex max-w-[1360px] mx-auto w-full overflow-hidden">

        {/* ── LEFT: Evaluation Queue ── */}
        <div className="w-[240px] xl:w-[260px] shrink-0 border-r border-[#EDE9FF]/80 bg-white flex flex-col hidden lg:flex">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Evaluation Queue</span>
            <span className="text-[9px] font-black text-white bg-[#6C47FF] px-1.5 py-0.5 rounded-full">{questions.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const isCurrent = i === currentIdx;
              const score = ans?.evaluation?.score;
              return (
                <button key={q.id} onClick={() => setCurrentIdx(i)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-all border-l-[3px] ${
                    isCurrent ? "bg-[#F8F7FF] border-[#6C47FF]" : "border-transparent hover:bg-gray-50"
                  }`}>
                  <div className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                    ans?.skipped     ? "bg-gray-100 text-gray-400" :
                    ans?.notAnswered ? "bg-red-50 text-red-500 border border-red-200" :
                    ans?.done && (score||0)>=8 ? "bg-green-50 text-green-700 border border-green-200" :
                    ans?.done && (score||0)>=6 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    ans?.done   ? "bg-red-50 text-red-600 border border-red-200" :
                    isCurrent   ? "bg-[#6C47FF] text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {ans?.skipped ? "—" : ans?.notAnswered ? "✕" : ans?.done ? (score ?? "✓") : String(i+1).padStart(2,"0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    {isCurrent && <span className="text-[8px] font-black text-[#6C47FF] bg-[#EDE9FF] px-1.5 py-0.5 rounded uppercase tracking-wide inline-block mb-0.5">Active</span>}
                    <p className={`text-[11px] line-clamp-2 leading-snug ${isCurrent ? "text-gray-900 font-semibold" : "text-gray-500"}`}>{q.question}</p>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-1 block capitalize">{q.category}</span>
                    {isCurrent && <span className="text-[9px] font-mono text-gray-400">{fmt(elapsed)}</span>}
                  </div>
                </button>
              );
            })}
            <button onClick={() => {}} className="w-full p-3.5 flex items-center gap-2 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition border-l-[3px] border-transparent">
              <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold">+</span>
              Add Question
            </button>
          </div>
          {/* Candidate footer */}
          {sessionData && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
              <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-black shrink-0">
                {sessionData.candidate_name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{sessionData.candidate_name}</p>
                <p className="text-[10px] text-gray-400 truncate">{sessionData.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER ── */}
        <div className="flex-1 flex flex-col p-4 xl:p-5 gap-4 overflow-y-auto min-w-0">
          {currentQ ? (
            <>
              {/* Active Probe Card */}
              <div className="bg-white rounded-2xl border border-[#EDE9FF] p-5 shadow-sm fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#6C47FF] bg-[#EDE9FF]/60 px-2 py-1 rounded-full uppercase tracking-wider">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 4v2.5m0 1v.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      Active Probe
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${CAT_STYLE[currentQ.category] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{currentQ.category}</span>
                    {currentQ.timeGuide && <span className="text-[10px] text-gray-400">⏱ {currentQ.timeGuide}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={goPrev} disabled={currentIdx === 0}
                      className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-20 transition text-xs font-bold flex items-center justify-center">←</button>
                    <span className="text-[10px] text-gray-400 font-mono">{currentIdx+1}/{questions.length}</span>
                    <button onClick={goNext} disabled={currentIdx === questions.length-1}
                      className="w-7 h-7 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-20 transition text-xs font-bold flex items-center justify-center">→</button>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-900 leading-snug mb-4">
                  "{currentQ.question}"
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setShowRubric(!showRubric)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6C47FF] bg-[#EDE9FF]/40 border border-[#EDE9FF] hover:bg-[#EDE9FF] rounded-full px-3 py-1 transition">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 4l4 3 4-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    {showRubric ? "Hide guide" : "Look for: Show guide"}
                  </button>
                </div>

                {showRubric && (
                  <div className="mt-4 bg-[#F8F7FF] border border-[#EDE9FF] rounded-xl p-4 fade-in">
                    <p className="text-[10px] font-bold text-[#6C47FF] uppercase tracking-wider mb-2">Grading Criteria</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{currentQ.rubric}</p>
                  </div>
                )}
              </div>

              {/* Candidate Answer + Transcript */}
              <div className="bg-white rounded-2xl border border-[#EDE9FF] shadow-sm flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Candidate Answer</span>
                    {recording && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500">
                        <span className="relative flex w-2 h-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400/60"/>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/>
                        </span>
                        LIVE
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowNotes(!showNotes)}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold border px-3 py-1.5 rounded-lg transition ${
                      showNotes ? "bg-[#EDE9FF] text-[#6C47FF] border-[#6C47FF]/30" : "text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}>
                    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5"><path d="M2 2h8a1 1 0 011 1v6a1 1 0 01-1 1H5L2 13V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/></svg>
                    {showNotes ? "Hide notes" : "Add Notes"}
                  </button>
                </div>

                {/* Transcript textarea */}
                <div className="relative">
                  {recording && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-red-500 text-white px-2.5 py-1 rounded-full shadow-sm text-[10px] font-black">
                      <span className="w-1.5 h-1.5 bg-white rounded-full rec-pulse"/>
                      Listening · {fmt(elapsed)}
                    </div>
                  )}
                  <textarea
                    ref={transcriptRef}
                    value={editTranscript}
                    onChange={e => setEditTranscript(e.target.value)}
                    rows={6}
                    placeholder={recording
                      ? "Transcribing live audio..."
                      : "Paste or type the candidate's response here, or click Record Answer to transcribe live..."}
                    disabled={isLocked}
                    className={`w-full px-5 py-4 text-sm resize-none focus:outline-none transition-colors leading-relaxed grid-texture ${
                      recording ? "bg-red-50/20 placeholder:text-red-300" :
                      isLocked ? "bg-[#F8F7FF] text-gray-400 cursor-not-allowed" : "bg-white hover:bg-[#FAFAFE]"
                    } ${editTranscript ? "text-gray-900" : "text-gray-400 italic"}`}
                  />
                  {recording && editTranscript && (
                    <p className="absolute bottom-3 right-4 text-[10px] text-gray-400 italic">
                      Candidate is speaking...<span className="caret-blink">|</span>
                    </p>
                  )}
                </div>

                {/* Notes section */}
                {showNotes && (
                  <div className="border-t border-gray-100 px-5 py-3.5 bg-amber-50/30 fade-in">
                    <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                      🔒 Interviewer Notes — Private
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      placeholder="Add private observations, red flags, or impressions here..."
                      disabled={isLocked}
                      className="w-full border border-amber-200 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white placeholder:text-amber-300 text-gray-700"
                    />
                  </div>
                )}

                {/* ── Action Bar ── */}
                <div className="border-t border-gray-100 px-4 py-3.5 flex flex-wrap items-center gap-2 bg-gray-50/50 rounded-b-2xl">
                  {/* Timer pill */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400 border border-gray-200 bg-white px-3 py-2 rounded-lg shrink-0">
                    {fmt(elapsed)}
                  </div>

                  {/* Edit icon */}
                  <button className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition shrink-0" title="Edit transcript">
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M11 2l3 3L5 14H2v-3L11 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>

                  {/* Skip */}
                  <button onClick={skip} disabled={!!currentAns?.done}
                    className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition disabled:opacity-30">
                    Skip
                  </button>

                  {/* Right-side actions */}
                  <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                    {!editTranscript.trim() && !isLocked && !recording && (
                      <button onClick={() => evaluate(true)}
                        className="text-amber-600 text-[11px] font-bold px-3.5 py-2 border border-amber-200 rounded-xl hover:bg-amber-50 transition">
                        Mark Unanswered
                      </button>
                    )}

                    {editTranscript.trim() && !isLocked && (
                      <button onClick={() => evaluate(false)} disabled={currentAns?.loading}
                        className="bg-[#6C47FF] hover:bg-[#5A3AE0] text-white text-sm font-bold px-5 py-2 rounded-xl transition active:scale-[0.97] disabled:opacity-50 shadow-md shadow-purple-100">
                        {currentAns?.loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spin"/>
                            Analyzing...
                          </span>
                        ) : "Evaluate ✓"}
                      </button>
                    )}

                    {currentAns?.done && currentIdx < questions.length - 1 && (
                      <button onClick={goNext} className="bg-[#6C47FF] text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-[#5A3AE0] transition">
                        Next →
                      </button>
                    )}

                    <button onClick={recording ? stopRec : startRec} disabled={isLocked}
                      className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition active:scale-[0.97] disabled:opacity-30 ${
                        recording
                          ? "bg-white text-red-500 border border-red-200 hover:bg-red-50"
                          : "bg-gray-950 text-white hover:bg-gray-800 shadow-sm"
                      }`}>
                      {recording ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded bg-red-500 shrink-0"/>
                          Stop
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0"><circle cx="8" cy="8" r="3" fill="white"/><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.2"/></svg>
                          Record Answer →
                        </>
                      )}
                    </button>
                  </div>

                  {error && <p className="w-full text-red-500 text-[11px] font-semibold mt-1">⚠ {error}</p>}
                </div>
              </div>

              {/* All done banner */}
              {answeredCount === questions.length && questions.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center scale-in shadow-sm">
                  <p className="font-bold text-green-900 mb-1">✓ All questions evaluated!</p>
                  <p className="text-xs text-green-600 mb-4">Compile the structured assessment report below.</p>
                  <button onClick={finish} className="bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-xl font-bold text-sm transition shadow-md">
                    Compile Assessment Dossier →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">No questions loaded.</div>
          )}
        </div>

        {/* ── RIGHT: Calibrated Verdict ── */}
        <div className="w-[260px] xl:w-[280px] shrink-0 border-l border-[#EDE9FF]/80 bg-white overflow-y-auto hidden lg:flex flex-col">

          {/* Verdict */}
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-gray-400"><path d="M2 12l4-8 4 8M4 9h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Calibrated Verdict</span>
              </div>
              {currentAns?.evaluation?.score != null && <ScoreRing score={currentAns.evaluation.score}/>}
            </div>

            {currentAns?.evaluation && (
              <>
                <p className="text-xs font-bold text-gray-600 italic capitalize mb-3">
                  {currentAns.evaluation.sentiment === "not_answered" ? "Not Answered" :
                    currentAns.evaluation.sentiment === "excellent" ? "Excellent Response" :
                    currentAns.evaluation.sentiment === "good" ? "Good Response" :
                    currentAns.evaluation.sentiment === "weak" ? "Weak Response" : "Neutral Response"}
                </p>
                {currentAns.evaluation.score != null && (
                  <div className="space-y-2">
                    {[
                      { label:"Technical Depth",  val: Math.min(10, +(currentAns.evaluation.score * 0.93).toFixed(1)) },
                      { label:"Communication",    val: Math.min(10, +(currentAns.evaluation.score * 0.77).toFixed(1)) },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500 font-medium">{m.label}</span>
                          <span className="font-bold text-gray-700">{m.val}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-1.5 bg-[#6C47FF] rounded-full fill-bar" style={{ width: `${m.val * 10}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {currentAns?.loading && (
              <div className="flex items-center gap-2 py-1 text-[#6C47FF]">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#6C47FF] rounded-full bounce-dot-1"/>
                  <span className="w-1.5 h-1.5 bg-[#6C47FF] rounded-full bounce-dot-2"/>
                  <span className="w-1.5 h-1.5 bg-[#6C47FF] rounded-full bounce-dot-3"/>
                </div>
                <p className="text-[11px] font-bold">AI Evaluating...</p>
              </div>
            )}

            {!currentAns?.done && !currentAns?.loading && (
              <p className="text-[11px] text-gray-400 italic">Submit an answer to see the AI verdict.</p>
            )}
          </div>

          {/* Feedback Analysis */}
          {currentAns?.evaluation?.analysis && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Feedback Analysis</p>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-[11px] text-gray-600 leading-relaxed">
                "{currentAns.evaluation.analysis}"
              </div>
            </div>
          )}

          {/* Key Strengths */}
          {currentAns?.evaluation?.strength && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">Key Strengths</p>
              <div className="space-y-1.5">
                {currentAns.evaluation.strength.split(/[.;]/).filter(s => s.trim()).slice(0,3).map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-green-700">
                    <span className="text-green-500 shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{s.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Gaps */}
          {currentAns?.evaluation?.gap && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Performance Gaps</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">{currentAns.evaluation.gap}</p>
            </div>
          )}

          {/* Follow-up Probes */}
          {currentAns?.evaluation?.followUp && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Follow-up Probes</p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-2.5">
                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">"{currentAns.evaluation.followUp}"</p>
              </div>
              <button onClick={() => addFollowUp(currentAns.evaluation!.followUp!)} disabled={addingQ}
                className="w-full bg-[#6C47FF] hover:bg-[#5A3AE0] text-white text-[11px] font-bold py-2 rounded-xl transition active:scale-[0.97] disabled:opacity-50">
                {addingQ ? "Adding..." : "Ask this follow-up →"}
              </button>
            </div>
          )}

          {currentAns?.skipped && (
            <div className="p-4 border-b border-gray-50 text-center">
              <p className="text-[11px] font-semibold text-gray-400">⏭ Question skipped</p>
            </div>
          )}

          {/* Metrics Scoreboard */}
          {Object.values(answers).some(a => a.done) && (
            <div className="p-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Metrics Scoreboard</p>
              {(() => {
                const scored = Object.values(answers).filter(a => a.done && a.evaluation?.score != null && !a.notAnswered);
                const avg = scored.length ? scored.reduce((s,a) => s + (a.evaluation?.score ?? 0), 0) / scored.length : 0;
                return (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#F8F7FF] rounded-xl p-2.5 text-center border border-[#EDE9FF]">
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-0.5">Avg Score</p>
                      <p className="text-base font-black text-gray-800">{avg > 0 ? avg.toFixed(1) : "—"}</p>
                    </div>
                    <div className="bg-[#F8F7FF] rounded-xl p-2.5 text-center border border-[#EDE9FF]">
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-0.5">Accuracy</p>
                      <p className="text-base font-black text-gray-800">{avg > 0 ? Math.round(avg * 10) : "—"}%</p>
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-2">
                {questions.map((q, i) => {
                  const a = answers[q.id];
                  if (!a?.done) return null;
                  const s = a.evaluation?.score ?? 0;
                  return (
                    <div key={q.id} className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-400 font-bold w-5 shrink-0">Q{i+1}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full fill-bar ${s>=8?"bg-green-500":s>=6?"bg-amber-400":"bg-red-400"}`}
                          style={{width:`${s*10}%`,animationDelay:`${i*50}ms`}}/>
                      </div>
                      <span className="text-[9px] font-black text-gray-500 w-4 text-right">{a.notAnswered?"✕":s}</span>
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