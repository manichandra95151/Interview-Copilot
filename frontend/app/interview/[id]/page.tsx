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
  behavioral: "bg-blue-50 text-blue-700 border-blue-100",
  situational: "bg-purple-50 text-purple-700 border-purple-100",
  experience: "bg-green-50 text-green-700 border-green-100",
  technical: "bg-orange-50 text-orange-700 border-orange-100",
  culture: "bg-pink-50 text-pink-700 border-pink-100",
  leadership: "bg-indigo-50 text-indigo-700 border-indigo-100",
  "follow-up": "bg-cyan-50 text-cyan-700 border-cyan-100",
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = score / 10;
  const r = 20, circ = 2 * Math.PI * r;
  const color = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626";
  return (
    <svg className="w-12 h-12" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4"/>
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform="rotate(-90 24 24)" style={{ transition: "stroke-dashoffset 0.8s ease" }}/>
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="800" fill={color}>{score}</text>
    </svg>
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
  const [liveTranscript, setLiveTranscript] = useState("");
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
        
        // Populate answers from session data
        if (s.answers && Array.isArray(s.answers)) {
          const ansMap: Record<number, AnswerState> = {};
          s.answers.forEach((a: any) => {
            const isNotAnswered = a.sentiment === 'not_answered' || a.score === 0;
            ansMap[a.question_id] = {
              transcript: a.transcript || "",
              evaluation: {
                score: a.score,
                strength: a.strength,
                gap: a.gap,
                followUp: a.followUp,
                sentiment: a.sentiment,
                analysis: a.analysis
              },
              loading: false,
              done: !a.skipped,
              skipped: a.skipped,
              notAnswered: isNotAnswered,
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

  // Sync editTranscript and notes when currentQ changes
  useEffect(() => {
    if (currentQ) {
      const ans = answers[currentQ.id];
      setEditTranscript(ans?.transcript || "");
      setNotes(ans?.notes || "");
    } else {
      setEditTranscript("");
      setNotes("");
    }
  }, [currentQ?.id]);

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const startRec = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice recording requires Chrome or Edge browser."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let t = ""; for (let i=0;i<e.results.length;i++) t += e.results[i][0].transcript;
      setLiveTranscript(t); setEditTranscript(t);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start(); recognitionRef.current = rec;
    setLiveTranscript(""); setEditTranscript(""); setRecording(true);
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
    setLiveTranscript(""); setEditTranscript(""); setShowRubric(false);
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
  };

  const goNext = () => { if (currentIdx < questions.length-1) { setCurrentIdx(i=>i+1); setShowRubric(false); } };
  const goPrev = () => { if (currentIdx > 0) { setCurrentIdx(i=>i-1); setShowRubric(false); } };

  const finish = async () => {
    setFinishing(true);
    try { await api.generateReport(sessionId, token); router.push(`/report/${sessionId}`); }
    catch (e: any) { setError(e.message); setFinishing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full bg-white p-8 rounded-3xl border border-[#EDE9FF] shadow-xl shadow-purple-50/50 fade-up">
        {/* Animated Spinners */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#EDE9FF] animate-pulse"></div>
          <svg className="w-12 h-12 animate-spin text-[#6C47FF]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5"></circle>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 mb-1 text-sm">Initializing Workspace</h3>
        <p className="text-gray-400 text-xs">Calibrating interview parameters...</p>
      </div>
    </div>
  );

  if (finishing) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full bg-white p-8 rounded-3xl border border-[#EDE9FF] shadow-xl shadow-purple-50/50 fade-up">
        {/* Animated Spinners */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#EDE9FF] animate-pulse"></div>
          <svg className="w-12 h-12 animate-spin text-[#6C47FF]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5"></circle>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-1">Compiling Dossier</h2>
        <p className="text-gray-400 text-xs">Assembling report parameters...</p>

        {/* Pipeline Checklist */}
        <div className="text-left space-y-3 mb-2 max-w-[240px] mx-auto border-t border-gray-100 pt-5 mt-5">
          <div className="flex items-center gap-3 text-xs">
            <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
            <span className="text-gray-500 font-medium">Aggregating transcripts</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
            <span className="text-gray-500 font-medium">Scoring competency structures</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="w-4 h-4 rounded-full border-2 border-[#6C47FF] border-t-transparent animate-spin shrink-0"></span>
            <span className="text-gray-950 font-bold">Synthesizing overall assessment</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Top Workspace Bar */}
      <div className="bg-white border-b border-[#EDE9FF]/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between h-16 gap-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">C</div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate leading-tight">{sessionData?.candidate_name}</p>
                <p className="text-[10px] text-gray-400 truncate mt-0.5">{sessionData?.role} · {sessionData?.seniority}</p>
              </div>
            </div>
            
            {/* Horizontal progress indicators */}
            <div className="flex-1 max-w-md hidden md:block">
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                <span>Assessment Progress: {answeredCount}/{questions.length} completed</span>
                <span className="font-mono">Time elapsed: {fmt(elapsed)}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#6C47FF] h-1.5 rounded-full transition-all duration-500 fill-bar" style={{ width: `${progress}%` }}/>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {answeredCount >= 1 && (
                <button onClick={finish} className="bg-green-600 hover:bg-green-700 text-white text-xs px-4.5 py-2.5 rounded-xl transition font-bold shadow-md shadow-green-100">
                  Compile Assessment →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-5 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Question Tracker */}
        <div className="lg:col-span-3 order-3 lg:order-1">
          <div className="bg-white rounded-2xl border border-[#EDE9FF] overflow-hidden shadow-sm sticky top-22">
            <div className="px-4 py-3.5 border-b border-gray-50 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evaluation Queue</p>
            </div>
            <div className="max-h-[68vh] overflow-y-auto divide-y divide-gray-50">
              {questions.map((q, i) => {
                const ans = answers[q.id];
                const isCurrent = i === currentIdx;
                const score = ans?.evaluation?.score;
                return (
                  <button key={q.id} onClick={() => { setCurrentIdx(i); setShowRubric(false); }}
                    className={`w-full text-left p-4 flex items-start gap-3.5 transition border-l-3 ${isCurrent ? "bg-[#F8F7FF] border-[#6C47FF] font-semibold" : "hover:bg-gray-50 border-transparent"}`}>
                    <div className={`w-5.5 h-5.5 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      ans?.skipped ? "bg-gray-100 text-gray-400" :
                      ans?.notAnswered ? "bg-red-50 text-red-500" :
                      ans?.done && (score||0) >= 8 ? "bg-green-50 text-green-700 border border-green-200" :
                      ans?.done && (score||0) >= 6 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      ans?.done ? "bg-red-50 text-red-600 border border-red-200" :
                      isCurrent ? "bg-[#6C47FF] text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {ans?.skipped ? "—" : ans?.notAnswered ? "✕" : ans?.done ? (score ?? "✓") : i+1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs ${isCurrent ? "text-gray-900" : "text-gray-500"} line-clamp-2 leading-relaxed`}>{q.question}</p>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mt-1">{q.category}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Question Workspace */}
        <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
          {currentQ && (
            <>
              {/* Target Prompt Card */}
              <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-[#EDE9FF] text-[#6C47FF] font-bold px-2.5 py-1 rounded-full">Index: {currentIdx+1} / {questions.length}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border ${CAT_STYLE[currentQ.category] || "bg-gray-50 text-gray-500"}`}>{currentQ.category}</span>
                    {currentQ.timeGuide && <span className="text-xs text-gray-400 font-medium ml-2">⏱ Recommended duration: {currentQ.timeGuide}</span>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={goPrev} disabled={currentIdx===0} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-20 transition text-xs font-bold">Prev</button>
                    <button onClick={goNext} disabled={currentIdx===questions.length-1} className="p-1.5 rounded-lg border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-20 transition text-xs font-bold">Next</button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-relaxed mb-4">{currentQ.question}</h3>
                <button onClick={() => setShowRubric(!showRubric)} className="text-xs font-semibold text-[#6C47FF] hover:text-[#5a3ae0] transition flex items-center gap-1">
                  {showRubric ? "Hide assessment guide ↑" : "Show assessment guide ↓"}
                </button>
                {showRubric && (
                  <div className="mt-4 bg-[#F8F7FF] rounded-xl p-4.5 border border-[#EDE9FF] fade-up">
                    <p className="text-xs font-bold text-[#6C47FF] uppercase tracking-wider mb-2.5">Grading Criteria & Rubric</p>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{currentQ.rubric}</p>
                  </div>
                )}
              </div>

              {/* Assessment Work Area */}
              <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Candidate Transcript</p>
                  <button onClick={() => setShowNotes(!showNotes)} className="text-xs font-bold text-[#6C47FF] hover:text-[#5a3ae0] transition">
                    {showNotes ? "— Hide Interviewer Notes" : "+ Add Interviewer Notes"}
                  </button>
                </div>

                <div className="relative mb-4">
                  {recording && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full shadow-sm">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"/>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Listening</span>
                    </div>
                  )}
                  <textarea value={editTranscript} onChange={e => setEditTranscript(e.target.value)} rows={7}
                    placeholder={recording ? "Analyzing live mic stream... text will print automatically" : "Paste candidate response transcript here or click the microphone to transcribe live..."}
                    disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                    className={`w-full border rounded-xl px-4 py-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition leading-relaxed ${
                      recording ? "border-red-300 bg-red-50/20" :
                      (currentAns?.done || currentAns?.skipped || currentAns?.notAnswered) ? "border-gray-200 bg-gray-50/80 text-gray-500" :
                      "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                    }`}/>
                </div>

                {showNotes && (
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Interviewer Notes (Private)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add private comments, observations, or warnings..."
                      disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition bg-gray-50/50 focus:bg-white"/>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={recording ? stopRec : startRec}
                    disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 ${
                      recording ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-100" : "bg-gray-950 text-white hover:bg-gray-800"
                    }`}>
                    {recording ? "⏹ Stop Capture" : "🎙 Record Answer"}
                  </button>

                  {editTranscript.trim() && !currentAns?.done && (
                    <button onClick={() => evaluate(false)} disabled={currentAns?.loading}
                      className="bg-[#6C47FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5A3AE0] disabled:opacity-50 transition shadow-lg shadow-purple-100">
                      {currentAns?.loading ? "Analyzing..." : "Evaluate ✓"}
                    </button>
                  )}

                  {!editTranscript.trim() && !currentAns?.done && !recording && (
                    <button onClick={() => evaluate(true)}
                      className="text-amber-600 text-xs px-4 py-2.5 hover:text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-50/50 transition font-bold">
                      Mark as Unanswered
                    </button>
                  )}

                  <button onClick={skip} disabled={!!currentAns?.done} className="text-gray-400 text-xs px-3 py-2.5 hover:text-gray-600 transition rounded-xl hover:bg-gray-50 font-bold">
                    Skip Question
                  </button>

                  {currentAns?.done && currentIdx < questions.length - 1 && (
                    <button onClick={goNext} className="ml-auto bg-[#6C47FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5A3AE0] transition">
                      Continue to Next →
                    </button>
                  )}
                </div>

                {error && <p className="text-red-500 text-xs mt-3.5 font-semibold">⚠️ {error}</p>}
              </div>

              {/* Assessment Dossier Compilation Alert */}
              {answeredCount === questions.length && questions.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center fade-up shadow-sm">
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="font-bold text-green-900 mb-1">Assessment parameters complete!</h3>
                  <p className="text-xs text-green-600 mb-4.5">All questions have been evaluated. compile the structured report dossier below.</p>
                  <button onClick={finish} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition shadow-md shadow-green-200">
                    Compile Assessment Dossier →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Live Assessment Evaluation Panel */}
        <div className="lg:col-span-3 order-2 lg:order-3 space-y-6">
          {/* Analysis Loading Status */}
          {currentAns?.loading && (
            <div className="bg-[#F8F7FF] border border-[#6C47FF]/20 rounded-2xl p-4.5 fade-in">
              <div className="flex items-center gap-2.5 text-[#6C47FF] mb-2">
                <div className="w-2 h-2 rounded-full bg-[#6C47FF] animate-bounce"/>
                <p className="text-xs font-bold uppercase tracking-wider">AI Evaluation Processing</p>
              </div>
              <p className="text-[11px] text-[#6C47FF]/70 leading-normal">Scoring response structures, searching for domain metrics, and preparing recommendations.</p>
            </div>
          )}

          {/* Current Evaluation Report Card */}
          {currentAns?.done && currentAns.evaluation && (
            <div className="bg-white border border-[#EDE9FF] rounded-2xl p-4.5 fade-up space-y-4.5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Calibrated Verdict</p>
                  <p className="text-xs font-bold text-gray-800 capitalize mt-0.5">{currentAns.evaluation.sentiment || "Neutral"} Response</p>
                </div>
                <ScoreRing score={currentAns.evaluation.score} />
              </div>

              {currentAns.evaluation.analysis && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Feedback Analysis</p>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                    {currentAns.evaluation.analysis}
                  </p>
                </div>
              )}

              {currentAns.evaluation.strength && (
                <div className="bg-green-50/70 border border-green-100/30 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider mb-1">Key Strengths</p>
                  <p className="text-xs text-green-600 leading-relaxed">{currentAns.evaluation.strength}</p>
                </div>
              )}

              {currentAns.evaluation.gap && (
                <div className="bg-amber-50/70 border border-amber-100/30 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Performance Gaps</p>
                  <p className="text-xs text-amber-600 leading-relaxed">{currentAns.evaluation.gap}</p>
                </div>
              )}

              {currentAns.evaluation.followUp && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Follow-up Recommendation</p>
                  <p className="text-xs text-blue-600 leading-relaxed italic mb-3">&ldquo;{currentAns.evaluation.followUp}&rdquo;</p>
                  <button
                    onClick={async () => {
                      if (!token) return;
                      try {
                        const newQ = await api.addQuestion(
                          sessionId,
                          currentAns.evaluation!.followUp!,
                          "follow-up",
                          `Follow-up to Q${currentIdx + 1}: "${currentQ.question}"`,
                          token
                        );
                        setQuestions(prev => {
                          const updated = [...prev];
                          updated.splice(currentIdx + 1, 0, newQ);
                          return updated;
                        });
                        setCurrentIdx(currentIdx + 1);
                        setShowRubric(false);
                      } catch (err: any) {
                        setError("Failed to add follow-up: " + err.message);
                      }
                    }}
                    className="w-full bg-[#6C47FF] hover:bg-[#5A3AE0] text-white text-[11px] py-1.5 rounded-lg transition font-bold shadow-md shadow-purple-100"
                  >
                    Ask this follow-up
                  </button>
                </div>
              )}
            </div>
          )}

          {currentAns?.skipped && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-semibold text-gray-400">⏭ Question bypassed</p>
            </div>
          )}

          {currentAns?.notAnswered && (
            <div className="bg-red-50/40 border border-red-100/40 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-red-500">✕ Mark as unanswered</p>
            </div>
          )}

          {/* Calibrated Scores Breakdown */}
          {Object.values(answers).some(a => a.done) && (
            <div className="bg-white border border-[#EDE9FF] rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3.5">Metrics scoreboard</p>
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const a = answers[q.id];
                  if (!a?.done) return null;
                  const s = a.evaluation?.score ?? 0;
                  return (
                    <div key={q.id} className="flex items-center gap-2.5">
                      <span className="text-[10px] text-gray-400 font-bold w-5 shrink-0">Q{i+1}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${s>=8?"bg-green-500":s>=6?"bg-amber-500":"bg-red-400"}`}
                          style={{ width: `${s * 10}%` }}/>
                      </div>
                      <span className="text-[10px] font-extrabold text-gray-600 min-w-6 text-right">{a.notAnswered ? "✕" : s}</span>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const scored = Object.values(answers).filter(a => a.done && a.evaluation?.score != null && !a.notAnswered);
                const avg = scored.length ? (scored.reduce((s,a) => s + (a.evaluation?.score ?? 0), 0) / scored.length).toFixed(1) : "—";
                return (
                  <div className="mt-3.5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Score</p>
                    <p className="text-sm font-black text-gray-800">{avg} / 10</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}