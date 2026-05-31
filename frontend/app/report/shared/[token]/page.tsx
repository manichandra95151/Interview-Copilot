"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

type Report = {
  overallScore: number;
  verdict: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  redFlags: string[];
  nextSteps: string[];
  competencies: Record<string, number>;
};

function VerdictBanner({ verdict, score }: { verdict: string; score: number }) {
  const map: Record<string, { label: string; icon: string; cls: string; bg: string }> = {
    recommend_hire: { label: "Recommend Hire", icon: "✅", cls: "text-green-900", bg: "bg-green-50 border-green-200" },
    consider: { label: "Consider", icon: "🤔", cls: "text-amber-900", bg: "bg-amber-50 border-amber-200" },
    no_hire: { label: "No Hire", icon: "❌", cls: "text-red-900", bg: "bg-red-50 border-red-200" },
  };
  const v = map[verdict] || { label: "Review Needed", icon: "📋", cls: "text-gray-900", bg: "bg-gray-50 border-gray-200" };
  return (
    <div className={`border rounded-2xl px-6 py-5 flex items-center justify-between gap-4 ${v.bg}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{v.icon}</span>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-0.5">AI Verdict</p>
          <p className={`text-xl font-bold ${v.cls}`}>{v.label}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-medium text-gray-500 mb-0.5">Overall Score</p>
        <p className={`text-3xl font-bold ${v.cls}`}>{score}<span className="text-base text-gray-400">/10</span></p>
      </div>
    </div>
  );
}

function CompetencyBar({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 capitalize min-w-36">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full score-bar-fill ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 min-w-8">{score}/10</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-gray-400 px-2 py-1 rounded-lg bg-gray-100">Skipped</span>;
  const cls = score >= 8 ? "bg-green-100 text-green-700" : score >= 6 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${cls}`}>{score}/10</span>;
}

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api.getSharedReport(token)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p className="text-gray-500 text-sm">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-red-100 p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 text-sm mb-4">This share link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const { report, sessionMeta, questions, answers } = data;
  const getAnswer = (qId: number) => answers?.find((a: any) => a.question_id == qId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">C</div>
            <span className="font-semibold text-gray-900">CopilotHire</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                {sessionMeta.candidate_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{sessionMeta.candidate_name}</h1>
                <p className="text-gray-500 text-sm">{sessionMeta.role} · {sessionMeta.seniority}</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              <p>{new Date(sessionMeta.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>{sessionMeta.answersCount}/{sessionMeta.questionsCount} questions answered</p>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <VerdictBanner verdict={report.verdict} score={report.overallScore} />

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">AI Summary</h2>
          <p className="text-gray-700 leading-relaxed">{report.summary}</p>
        </div>

        {/* Competencies */}
        {report.competencies && Object.keys(report.competencies).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Competency Scores</h2>
            <div className="space-y-3">
              {Object.entries(report.competencies).map(([key, val]) => (
                <CompetencyBar key={key} label={key} score={val as number} />
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Strengths</h2>
            <ul className="space-y-2">
              {(report.strengths || []).map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Gaps</h2>
            <ul className="space-y-2">
              {(report.gaps || []).map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-amber-500 shrink-0 mt-0.5">△</span>
                  {g}
                </li>
              ))}
              {(!report.gaps || report.gaps.length === 0) && <li className="text-sm text-gray-400">No significant gaps identified.</li>}
            </ul>
          </div>
        </div>

        {/* Red flags */}
        {report.redFlags && report.redFlags.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3">⚠️ Red Flags</h2>
            <ul className="space-y-2">
              {report.redFlags.map((f: string, i: number) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="shrink-0">•</span>{f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next steps */}
        <div className="bg-[#EDE9FF] border border-[#E8E4FF] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-[#6C47FF] uppercase tracking-wider mb-3">Recommended Next Steps</h2>
          <ol className="space-y-2">
            {(report.nextSteps || []).map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#4A2FE0]">
                <span className="bg-[#EDE9FF] text-[#6C47FF] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* Q&A breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Question-by-Question Breakdown</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(questions || []).map((q: any, i: number) => {
              const ans = getAnswer(q.id);
              const borderColor = !ans || ans.skipped ? "border-gray-200" :
                (ans.score ?? 0) >= 7 ? "border-green-300" : "border-amber-300";
              return (
                <div key={q.id} className={`p-6 border-l-4 ${borderColor}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">Q{i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        q.category === "behavioral" ? "bg-blue-100 text-blue-700" :
                        q.category === "situational" ? "bg-purple-100 text-purple-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>{q.category}</span>
                    </div>
                    <ScoreBadge score={ans?.score} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">{q.question}</p>
                  {ans?.transcript && !ans.skipped && (
                    <div className="bg-gray-50 rounded-xl px-4 py-3 mb-3">
                      <p className="text-xs text-gray-400 mb-1">Transcript</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{ans.transcript}</p>
                    </div>
                  )}
                  {ans?.skipped && <p className="text-sm text-gray-400 italic">Question was skipped</p>}
                  {ans && !ans.skipped && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {ans.strength && (
                        <div className="flex-1 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                          <p className="text-xs font-semibold text-green-700 mb-0.5">Strength</p>
                          <p className="text-xs text-green-600">{ans.strength}</p>
                        </div>
                      )}
                      {ans.gap && (
                        <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          <p className="text-xs font-semibold text-amber-700 mb-0.5">Gap</p>
                          <p className="text-xs text-amber-600">{ans.gap}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
