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
  behavioral: "bg-blue-100 text-blue-700",
  situational: "bg-purple-100 text-purple-700",
  experience: "bg-green-100 text-green-700",
  technical: "bg-orange-100 text-orange-700",
  culture: "bg-pink-100 text-pink-700",
  leadership: "bg-indigo-100 text-indigo-700",
  "follow-up": "bg-cyan-100 text-cyan-700",
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = score / 10;
  const r = 22, circ = 2 * Math.PI * r;
  const color = score >= 8 ? "#16a34a" : score >= 6 ? "#d97706" : "#dc2626";
  return (
    <svg className="w-14 h-14" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform="rotate(-90 28 28)" style={{ transition: "stroke-dashoffset 0.8s ease" }}/>
      <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{score}</text>
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
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3 animate-bounce">🎙️</div><p className="text-gray-400 text-sm">Loading interview...</p></div>
    </div>
  );

  if (finishing) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 brand-gradient rounded-3xl flex items-center justify-center mx-auto mb-5 text-4xl shadow-xl shadow-purple-200 animate-pulse">📊</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Generating report</h2>
        <p className="text-gray-400 text-sm">AI is analysing all answers, scoring competencies and writing your report...</p>
        <div className="w-full bg-[#EDE9FF] rounded-full h-1.5 mt-6 overflow-hidden">
          <div className="bg-[#6C47FF] h-1.5 rounded-full animate-pulse w-3/4"/>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-purple-50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-5">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">C</div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{sessionData?.candidate_name}</p>
                <p className="text-xs text-gray-400 truncate leading-tight">{sessionData?.role}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="flex-1 max-w-sm hidden md:block">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{answeredCount}/{questions.length} done</span>
                <span className="font-mono">{fmt(elapsed)}</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#6C47FF] h-1.5 rounded-full transition-all duration-500 fill-bar" style={{ width: `${progress}%` }}/>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {answeredCount >= 1 && (
                <button onClick={finish} className="bg-green-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-green-700 transition font-semibold shadow-sm">
                  Finish & Report →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-5 py-5 grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Sidebar: question list */}
        <div className="lg:col-span-2 order-3 lg:order-1">
          <div className="bg-white rounded-2xl border border-[#EDE9FF] overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Questions</p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {questions.map((q, i) => {
                const ans = answers[q.id];
                const isCurrent = i === currentIdx;
                const score = ans?.evaluation?.score;
                return (
                  <button key={q.id} onClick={() => { setCurrentIdx(i); setShowRubric(false); }}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-2 transition border-l-2 ${isCurrent ? "bg-[#EDE9FF] border-[#6C47FF]" : "hover:bg-gray-50 border-transparent"}`}>
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      ans?.skipped ? "bg-gray-100 text-gray-400" :
                      ans?.notAnswered ? "bg-red-100 text-red-500" :
                      ans?.done && (score||0) >= 8 ? "bg-green-100 text-green-700" :
                      ans?.done && (score||0) >= 6 ? "bg-amber-100 text-amber-700" :
                      ans?.done ? "bg-red-100 text-red-600" :
                      isCurrent ? "bg-[#6C47FF] text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {ans?.skipped ? "—" : ans?.notAnswered ? "✕" : ans?.done ? (score ?? "✓") : i+1}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{q.question}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main: question + recorder */}
        <div className="lg:col-span-7 order-1 lg:order-2 space-y-4">

          {currentQ && (
            <>
              {/* Question card */}
              <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-[#EDE9FF] text-[#6C47FF] font-bold px-2.5 py-1 rounded-full">Q{currentIdx+1}/{questions.length}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${CAT_STYLE[currentQ.category] || "bg-gray-100 text-gray-600"}`}>{currentQ.category}</span>
                    {currentQ.timeGuide && <span className="text-xs text-gray-400">⏱ {currentQ.timeGuide}</span>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={goPrev} disabled={currentIdx===0} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition text-sm">←</button>
                    <button onClick={goNext} disabled={currentIdx===questions.length-1} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-20 transition text-sm">→</button>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900 leading-relaxed mb-4">{currentQ.question}</p>
                <button onClick={() => setShowRubric(!showRubric)} className="text-xs text-[#6C47FF] hover:underline transition">
                  {showRubric ? "Hide rubric ↑" : "Show scoring rubric ↓"}
                </button>
                {showRubric && (
                  <div className="mt-3 bg-[#F8F7FF] rounded-xl p-4 border border-[#EDE9FF] fade-up">
                    <p className="text-xs font-semibold text-[#6C47FF] mb-2">Scoring rubric</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{currentQ.rubric}</p>
                  </div>
                )}
              </div>

              {/* Voice recorder */}
              <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-gray-700">Candidate&apos;s answer</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-gray-400 hover:text-gray-600 transition">{showNotes ? "Hide notes" : "Add notes"}</button>
                  </div>
                </div>

                <div className="relative mb-4">
                  {recording && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <div className="relative w-2.5 h-2.5 shrink-0">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full rec-pulse"/>
                      </div>
                      <span className="text-xs text-red-500 font-semibold">Recording</span>
                    </div>
                  )}
                  <textarea value={editTranscript} onChange={e => setEditTranscript(e.target.value)} rows={5}
                    placeholder={recording ? "Listening... candidate's words will appear here" : "Record candidate's answer, or type/paste it manually..."}
                    disabled={!!(currentAns?.done || currentAns?.skipped || currentAns?.notAnswered || currentAns?.loading)}
                    className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition leading-relaxed ${
                      recording ? "border-red-300 bg-red-50/50" :
                      (currentAns?.done || currentAns?.skipped || currentAns?.notAnswered) ? "border-gray-200 bg-gray-100/70 text-gray-600" :
                      "border-gray-200 bg-gray-50 hover:bg-white"
                    }`}/>
                </div>

                {showNotes && (
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Private notes (not shown to candidate or in report summary)..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition mb-4 bg-gray-50"/>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={recording ? stopRec : startRec}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      recording ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100" : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}>
                    {recording ? "⏹ Stop recording" : "🎙 Record answer"}
                  </button>

                  {editTranscript.trim() && !currentAns?.done && (
                    <button onClick={() => evaluate(false)} disabled={currentAns?.loading}
                      className="bg-[#6C47FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5A3AE0] disabled:opacity-50 transition shadow-lg shadow-purple-100">
                      {currentAns?.loading ? "Evaluating..." : "Evaluate ✓"}
                    </button>
                  )}

                  {!editTranscript.trim() && !currentAns?.done && !recording && (
                    <button onClick={() => evaluate(true)}
                      className="text-amber-600 text-sm px-4 py-2.5 hover:text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-50 transition font-medium">
                      Mark as not answered
                    </button>
                  )}

                  <button onClick={skip} className="text-gray-400 text-sm px-3 py-2.5 hover:text-gray-600 transition rounded-xl hover:bg-gray-100">
                    Skip question →
                  </button>

                  {currentAns?.done && currentIdx < questions.length - 1 && (
                    <button onClick={goNext} className="ml-auto bg-[#6C47FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5A3AE0] transition">
                      Next →
                    </button>
                  )}
                </div>

                {error && <p className="text-red-500 text-xs mt-3">⚠️ {error}</p>}
              </div>

              {/* All done banner */}
              {answeredCount === questions.length && questions.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center fade-up">
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="font-bold text-green-900 mb-1">All questions done!</h3>
                  <p className="text-sm text-green-600 mb-4">Click below to generate your full interview report with charts and recommendations.</p>
                  <button onClick={finish} className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition">
                    Generate Report →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: live eval panel */}
        <div className="lg:col-span-3 order-2 lg:order-3 space-y-4">

          {/* Loading */}
          {currentAns?.loading && (
            <div className="bg-[#EDE9FF] border border-[#6C47FF]/20 rounded-2xl p-4 fade-in">
              <div className="flex items-center gap-2 text-[#6C47FF] mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6C47FF] animate-bounce"/>
                <p className="text-xs font-semibold">AI evaluating...</p>
              </div>
              <p className="text-xs text-[#6C47FF]/60">Scoring against rubric · Detecting gaps · Generating follow-up</p>
            </div>
          )}

          {/* Evaluation result */}
          {currentAns?.done && currentAns.evaluation && (
            <div className="bg-white border border-[#EDE9FF] rounded-2xl p-4 fade-up space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Evaluation</p>
                <ScoreRing score={currentAns.evaluation.score} />
              </div>

              {currentAns.evaluation.analysis && (
                <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  {currentAns.evaluation.analysis}
                </p>
              )}

              {currentAns.evaluation.strength && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-green-700 mb-1">✓ Strength</p>
                  <p className="text-xs text-green-600 leading-relaxed">{currentAns.evaluation.strength}</p>
                </div>
              )}

              {currentAns.evaluation.gap && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-700 mb-1">△ Gap</p>
                  <p className="text-xs text-amber-600 leading-relaxed">{currentAns.evaluation.gap}</p>
                </div>
              )}

              {currentAns.evaluation.followUp && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-blue-700 mb-1">💡 Ask this follow-up</p>
                  <p className="text-xs text-blue-600 leading-relaxed italic mb-2.5">&ldquo;{currentAns.evaluation.followUp}&rdquo;</p>
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
                    className="w-full bg-[#6C47FF] hover:bg-[#5A3AE0] text-white text-xs py-1.5 rounded-lg transition font-semibold"
                  >
                    Ask this follow-up
                  </button>
                </div>
              )}

              {currentAns.evaluation.sentiment && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">Sentiment:</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    currentAns.evaluation.sentiment === "confident" ? "bg-green-100 text-green-700" :
                    currentAns.evaluation.sentiment === "hesitant"  ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{currentAns.evaluation.sentiment}</span>
                </div>
              )}
            </div>
          )}

          {currentAns?.skipped && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-400 text-center">⏭ Question skipped by interviewer</p>
            </div>
          )}

          {currentAns?.notAnswered && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-xs text-red-500 text-center font-medium">✕ Not answered by candidate</p>
            </div>
          )}

          {/* Running scoreboard */}
          {Object.values(answers).some(a => a.done) && (
            <div className="bg-white border border-[#EDE9FF] rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Live scores</p>
              <div className="space-y-2">
                {questions.map((q, i) => {
                  const a = answers[q.id];
                  if (!a?.done) return null;
                  const s = a.evaluation?.score ?? 0;
                  return (
                    <div key={q.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 w-5 shrink-0">Q{i+1}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full fill-bar ${s>=8?"bg-green-500":s>=6?"bg-amber-500":"bg-red-400"}`}
                          style={{ width: `${s * 10}%` }}/>
                      </div>
                      <span className="text-xs font-semibold text-gray-600 min-w-6 text-right">{a.notAnswered ? "✕" : s}</span>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const scored = Object.values(answers).filter(a => a.done && a.evaluation?.score != null && !a.notAnswered);
                const avg = scored.length ? (scored.reduce((s,a) => s + (a.evaluation?.score ?? 0), 0) / scored.length).toFixed(1) : "—";
                return (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Running avg</p>
                    <p className="text-sm font-bold text-gray-800">{avg}/10</p>
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