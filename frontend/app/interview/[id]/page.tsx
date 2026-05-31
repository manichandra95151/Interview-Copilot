"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Question = { id: number; question: string; category: string; rubric: string; timeGuide?: string };
type Evaluation = { score: number; strength: string; gap: string | null; followUp: string | null; sentiment: string };
type AnswerState = { transcript: string; evaluation: Evaluation | null; loading: boolean; done: boolean; skipped: boolean };

const CATEGORY_COLORS: Record<string, string> = {
  behavioral: "bg-blue-100 text-blue-700",
  situational: "bg-purple-100 text-purple-700",
  technical: "bg-orange-100 text-orange-700",
  "role-specific": "bg-orange-100 text-orange-700",
};

const SCORE_COLORS = (s: number) =>
  s >= 8 ? "text-green-700 bg-green-50 border-green-200" :
  s >= 6 ? "text-amber-700 bg-amber-50 border-amber-200" :
  "text-red-700 bg-red-50 border-red-200";

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full score-bar-fill ${score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 min-w-8">{score}/10</span>
    </div>
  );
}

export default function InterviewPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Voice recording
  const [recording, setRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Notes
  const [notes, setNotes] = useState("");
  const [followUpInput, setFollowUpInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Finishing
  const [finishing, setFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const currentQ = questions[currentIdx];
  const currentAnswer = currentQ ? answers[currentQ.id] : null;
  const answeredCount = Object.values(answers).filter(a => a.done || a.skipped).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  useEffect(() => {
    Promise.all([api.getSession(sessionId), api.getQuestions(sessionId)])
      .then(([sess, qData]) => {
        setSession(sess);
        setQuestions(qData.questions || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice recording not supported in this browser. Please use Chrome or Edge."); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: any) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setLiveTranscript(full);
      setEditedTranscript(full);
    };

    rec.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      setRecording(false);
    };

    rec.onend = () => setRecording(false);

    rec.start();
    recognitionRef.current = rec;
    setLiveTranscript("");
    setEditedTranscript("");
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setRecording(false);
  }, []);

  const evaluateAnswer = async () => {
    if (!currentQ || !editedTranscript.trim()) return;
    const qId = currentQ.id;

    setAnswers(prev => ({ ...prev, [qId]: { transcript: editedTranscript, evaluation: null, loading: true, done: false, skipped: false } }));

    try {
      const evaluation = await api.evaluateAnswer(sessionId, qId, editedTranscript, notes);
      setAnswers(prev => ({ ...prev, [qId]: { transcript: editedTranscript, evaluation, loading: false, done: true, skipped: false } }));
      setLiveTranscript("");
      setEditedTranscript("");
      setNotes("");
    } catch (e: any) {
      setAnswers(prev => ({ ...prev, [qId]: { transcript: editedTranscript, evaluation: null, loading: false, done: false, skipped: false } }));
      setError(e.message);
    }
  };

  const skipQuestion = async () => {
    if (!currentQ) return;
    await api.skipQuestion(sessionId, currentQ.id);
    setAnswers(prev => ({ ...prev, [currentQ.id]: { transcript: "", evaluation: null, loading: false, done: false, skipped: true } }));
    setLiveTranscript("");
    setEditedTranscript("");
    goNext();
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setLiveTranscript("");
      setEditedTranscript("");
      setNotes("");
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
      setLiveTranscript("");
      setEditedTranscript("");
    }
  };

  const finishInterview = async () => {
    setFinishing(true);
    try {
      await api.generateReport(sessionId);
      router.push(`/report/${sessionId}`);
    } catch (e: any) {
      setError(e.message);
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎙️</div>
          <p className="text-gray-500 text-sm">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (finishing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Generating your report</h2>
          <p className="text-gray-500 text-sm">AI is analysing all answers and writing your structured report...</p>
        </div>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link href="/dashboard" className="text-indigo-600 text-sm font-medium">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{session?.candidate_name}</p>
                <p className="text-xs text-gray-400 truncate">{session?.role}</p>
              </div>
            </div>
            <div className="flex-1 max-w-xs hidden sm:block">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{answeredCount}/{questions.length} answered</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 font-mono hidden sm:block">{formatTime(elapsed)}</span>
              {answeredCount >= 1 && (
                <button
                  onClick={finishInterview}
                  className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Finish & Report →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: question list */}
        <div className="lg:col-span-1 order-3 lg:order-1">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</p>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 lg:max-h-none overflow-y-auto">
              {questions.map((q, i) => {
                const ans = answers[q.id];
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`w-full text-left px-4 py-3 transition-colors ${isCurrent ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                        ans?.skipped ? "bg-gray-100 text-gray-400" :
                        ans?.done && (ans.evaluation?.score ?? 0) >= 7 ? "bg-green-100 text-green-700" :
                        ans?.done ? "bg-amber-100 text-amber-700" :
                        isCurrent ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {ans?.skipped ? "—" : ans?.done ? (ans.evaluation?.score ?? "✓") : i + 1}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{q.question}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Centre: main interview area */}
        <div className="lg:col-span-3 order-1 lg:order-2 space-y-4">

          {/* Question card */}
          {currentQ && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">Q{currentIdx + 1}/{questions.length}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[currentQ.category] || "bg-gray-100 text-gray-600"}`}>
                    {currentQ.category}
                  </span>
                  {currentQ.timeGuide && <span className="text-xs text-gray-400">⏱ {currentQ.timeGuide}</span>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={goPrev} disabled={currentIdx === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm">←</button>
                  <button onClick={goNext} disabled={currentIdx === questions.length - 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm">→</button>
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-900 leading-relaxed">{currentQ.question}</p>
              <details className="mt-4">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none">Show rubric</summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">{currentQ.rubric}</p>
              </details>
            </div>
          )}

          {/* Voice recorder */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">Candidate&apos;s answer</p>
              <button onClick={() => setShowNotes(!showNotes)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {showNotes ? "Hide notes" : "Add notes"}
              </button>
            </div>

            {/* Transcript area */}
            <div className="relative mb-4">
              {recording && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-500 font-medium">Recording</span>
                </div>
              )}
              <textarea
                value={editedTranscript}
                onChange={e => setEditedTranscript(e.target.value)}
                placeholder={recording ? "Listening..." : "Record candidate's answer or type here manually..."}
                rows={6}
                className={`w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  recording ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                }`}
              />
            </div>

            {/* Notes */}
            {showNotes && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Your private notes for this question..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-4 bg-gray-50"
              />
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  recording
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                <span>{recording ? "⏹ Stop" : "🎙 Record"}</span>
              </button>

              {editedTranscript.trim() && !currentAnswer?.done && (
                <button
                  onClick={evaluateAnswer}
                  disabled={currentAnswer?.loading}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {currentAnswer?.loading ? "Evaluating..." : "Evaluate ✓"}
                </button>
              )}

              <button
                onClick={skipQuestion}
                className="text-gray-400 text-sm px-3 py-2.5 hover:text-gray-600 transition-colors"
              >
                Skip →
              </button>

              {currentAnswer?.done && currentIdx < questions.length - 1 && (
                <button
                  onClick={goNext}
                  className="ml-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Next question →
                </button>
              )}
            </div>

            {error && <p className="text-red-500 text-xs mt-3">{error}</p>}
          </div>

          {/* All answered — wrap up */}
          {answeredCount === questions.length && questions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="font-semibold text-green-900 mb-1">All questions answered!</h3>
              <p className="text-sm text-green-600 mb-4">Click below to generate the full interview report.</p>
              <button onClick={finishInterview} className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Generate Report →
              </button>
            </div>
          )}
        </div>

        {/* Right: live evaluation panel */}
        <div className="lg:col-span-1 order-2 lg:order-3 space-y-4">

          {/* Current eval */}
          {currentAnswer?.loading && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <div className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse"></div>
                <p className="text-xs font-medium">AI evaluating...</p>
              </div>
            </div>
          )}

          {currentAnswer?.done && currentAnswer.evaluation && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 fade-up space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation</p>
                <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${SCORE_COLORS(currentAnswer.evaluation.score)}`}>
                  {currentAnswer.evaluation.score}/10
                </span>
              </div>

              <ScoreBar score={currentAnswer.evaluation.score} />

              {currentAnswer.evaluation.strength && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-green-700 mb-1">✓ Strength</p>
                  <p className="text-xs text-green-600 leading-relaxed">{currentAnswer.evaluation.strength}</p>
                </div>
              )}

              {currentAnswer.evaluation.gap && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-700 mb-1">△ Gap</p>
                  <p className="text-xs text-amber-600 leading-relaxed">{currentAnswer.evaluation.gap}</p>
                </div>
              )}

              {currentAnswer.evaluation.followUp && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-blue-700 mb-1">💡 Follow-up</p>
                  <p className="text-xs text-blue-600 leading-relaxed italic">&ldquo;{currentAnswer.evaluation.followUp}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {currentAnswer?.skipped && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-400 text-center">Question skipped</p>
            </div>
          )}

          {/* Running scores */}
          {Object.values(answers).some(a => a.done) && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Running scores</p>
              <div className="space-y-2">
                {questions.map((q, i) => {
                  const a = answers[q.id];
                  if (!a?.done) return null;
                  const score = a.evaluation?.score ?? 0;
                  return (
                    <div key={q.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5">Q{i + 1}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${score * 10}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-6">{score}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                {(() => {
                  const scored = Object.values(answers).filter(a => a.done && a.evaluation);
                  const avg = scored.length > 0 ? (scored.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0) / scored.length).toFixed(1) : "—";
                  return <p className="text-xs text-gray-500">Avg: <span className="font-bold text-gray-800">{avg}/10</span></p>;
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}