"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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

function VerdictBanner({ verdict, score }: { verdict, score }) {
  const map: Record<string, { label: string; icon: string; cls: string; bg: string; textCls: string }> = {
    recommend_hire: { label: "Recommend Hire", icon: "✓", cls: "bg-green-600", bg: "bg-green-50/50 border-green-200/50", textCls: "text-green-800" },
    consider: { label: "Consider Profiles", icon: "•", cls: "bg-amber-500", bg: "bg-amber-50/50 border-amber-200/50", textCls: "text-amber-800" },
    no_hire: { label: "Do Not Proceed", icon: "✕", cls: "bg-red-500", bg: "bg-red-50/50 border-red-200/50", textCls: "text-red-800" },
  };
  const v = map[verdict] || { label: "Under Review", icon: "📋", cls: "bg-gray-500", bg: "bg-gray-50/50 border-gray-200/50", textCls: "text-gray-800" };
  return (
    <div className={`border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${v.bg}`}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${v.cls}`}>
          {v.icon}
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Candidate evaluation verdict</p>
          <p className={`text-xl font-extrabold ${v.textCls} mt-0.5`}>{v.label}</p>
        </div>
      </div>
      <div className="text-center sm:text-right bg-white px-5 py-2.5 rounded-xl border border-[#EDE9FF]/50 shadow-sm shrink-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Overall assessment score</p>
        <p className="text-2xl font-black text-gray-800 mt-0.5">{score} <span className="text-xs text-gray-400 font-semibold">/ 10</span></p>
      </div>
    </div>
  );
}

function CompetencyBar({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-bold text-gray-500 capitalize min-w-32 tracking-wide">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-xs font-extrabold text-gray-700 min-w-8 text-right">{score} / 10</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded bg-gray-100">Bypassed</span>;
  const cls = score >= 8 ? "bg-green-50 text-green-700 border-green-100" : score >= 6 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-red-50 text-red-700 border-red-100";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded border ${cls}`}>{score} / 10</span>;
}

export default function ReportPage() {
  const { id: sessionId } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const token = (session as any)?._token;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      setError("Please sign in to view this report.");
      setLoading(false);
      return;
    }
    if (!token) return;
    api.getReport(sessionId, token)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId, token, status]);

  const handleShare = async () => {
    if (!token) return;
    setSharing(true);
    try {
      let shareToken = data?.sessionMeta?.shareToken;
      if (!shareToken) {
        const res = await api.createShare(sessionId, token);
        shareToken = res.shareToken;
        setData((prev: any) => ({
          ...prev,
          sessionMeta: {
            ...prev.sessionMeta,
            shareToken,
          }
        }));
      }
      const link = window.location.origin + `/report/shared/${shareToken}`;
      await navigator.clipboard.writeText(link);
      setSharedLink(link);
      setTimeout(() => setSharedLink(""), 3000);
    } catch (e: any) {
      alert("Failed to share report: " + e.message);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-3xl border border-[#EDE9FF] shadow-xl shadow-purple-50 max-w-sm">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p className="text-gray-400 text-xs">Assembling evaluation dossier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-[#EDE9FF] p-8 max-w-md text-center shadow-lg">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-500 font-semibold text-sm mb-4">{error}</p>
          <Link href="/dashboard" className="text-[#6C47FF] text-xs font-bold hover:underline">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const { report, sessionMeta, questions, answers } = data;
  const getAnswer = (qId: number) => answers?.find((a: any) => a.question_id == qId);

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-16">
      {/* Top Bar */}
      <nav className="bg-white border-b border-[#EDE9FF]/80 sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-4xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">C</div>
            <span className="font-bold text-gray-900 tracking-tight">CopilotHire</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="text-xs text-white bg-[#6C47FF] hover:bg-[#5A3AE0] px-4 py-2.5 rounded-xl transition duration-200 flex items-center gap-1.5 font-bold shadow-md shadow-purple-100"
            >
              {sharing ? "Processing..." : sharedLink ? "✓ Link Copied!" : "🔗 Share dossier"}
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs text-gray-600 border border-gray-200 bg-white px-4 py-2.5 rounded-xl hover:bg-gray-50 transition font-bold"
            >
              🖨️ Print
            </button>
            <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition ml-2">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 mt-8 space-y-6">

        {/* Dossier Header */}
        <div className="bg-white rounded-3xl border border-[#EDE9FF] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center text-white font-black text-xl shadow-md">
                {sessionMeta.candidate_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">{sessionMeta.candidate_name}</h1>
                <p className="text-xs text-gray-400 font-bold tracking-wide mt-0.5">{sessionMeta.role} · {sessionMeta.seniority}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400 font-mono sm:text-right">
              <p>{new Date(sessionMeta.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="mt-1 font-bold text-[#6C47FF]">{sessionMeta.answersCount} / {sessionMeta.questionsCount} Evaluated</p>
            </div>
          </div>
        </div>

        {/* Verdict Badge Banner */}
        <VerdictBanner verdict={report.verdict} score={report.overallScore} />

        {/* Summary Details */}
        <div className="bg-white rounded-3xl border border-[#EDE9FF] p-6 shadow-sm">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Assessment Synthesis</h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">{report.summary}</p>
        </div>

        {/* Competencies radar level list */}
        {report.competencies && Object.keys(report.competencies).length > 0 && (
          <div className="bg-white rounded-3xl border border-[#EDE9FF] p-6 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4.5">Target Competency Analysis</h2>
            <div className="space-y-4">
              {Object.entries(report.competencies).map(([key, val]) => (
                <CompetencyBar key={key} label={key} score={val as number} />
              ))}
            </div>
          </div>
        )}

        {/* Strengths and Gaps lists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-[#EDE9FF] p-6 shadow-sm">
            <h2 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-4">Verified Strengths</h2>
            <ul className="space-y-3">
              {(report.strengths || []).map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-3.5 text-xs text-gray-600 leading-relaxed">
                  <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-3xl border border-[#EDE9FF] p-6 shadow-sm">
            <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-4">Calibrated Gaps</h2>
            <ul className="space-y-3">
              {(report.gaps || []).map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-3.5 text-xs text-gray-600 leading-relaxed">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">△</span>
                  <span>{g}</span>
                </li>
              ))}
              {(!report.gaps || report.gaps.length === 0) && <li className="text-xs text-gray-400 italic">No significant target gaps recorded.</li>}
            </ul>
          </div>
        </div>

        {/* Flags warning */}
        {report.redFlags && report.redFlags.length > 0 && (
          <div className="bg-red-50 border border-red-200/50 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3.5">⚠️ Attention / Risk Assessment</h2>
            <ul className="space-y-2.5">
              {report.redFlags.map((f: string, i: number) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-3 leading-relaxed">
                  <span className="shrink-0 font-bold">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action roadmap */}
        <div className="bg-blue-50/60 border border-blue-200/50 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4">Interviewer Roadmap Suggestions</h2>
          <ol className="space-y-3">
            {(report.nextSteps || []).map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
                <span className="bg-blue-600/10 text-blue-700 text-[10px] font-bold w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Question-by-Question breakdown logs */}
        <div className="bg-white rounded-3xl border border-[#EDE9FF] overflow-hidden shadow-sm">
          <div className="px-6 py-4.5 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Q&A Audit Log</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(questions || []).map((q: any, i: number) => {
              const ans = getAnswer(q.id);
              const borderColor = !ans || ans.skipped ? "border-gray-200" :
                (ans.score ?? 0) >= 7 ? "border-green-300" : "border-amber-300";
              return (
                <div key={q.id} className={`p-6 border-l-4 ${borderColor}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">Q{i + 1}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase px-2 py-0.5 rounded bg-gray-100">{q.category}</span>
                    </div>
                    <ScoreBadge score={ans?.score} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">{q.question}</h4>
                  {ans?.transcript && !ans.skipped && (
                    <div className="bg-gray-50 rounded-2xl p-4 mb-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Candidate Transcript</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{ans.transcript}</p>
                    </div>
                  )}
                  {ans?.skipped && <p className="text-xs text-gray-400 italic leading-relaxed">Question bypassed by interviewer.</p>}
                  {ans && !ans.skipped && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-3">
                      {ans.strength && (
                        <div className="flex-1 bg-green-50/50 border border-green-100/30 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1">Detected Strength</p>
                          <p className="text-xs text-green-600 leading-relaxed">{ans.strength}</p>
                        </div>
                      )}
                      {ans.gap && (
                        <div className="flex-1 bg-amber-50/50 border border-amber-100/30 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Detected Gap</p>
                          <p className="text-xs text-amber-600 leading-relaxed">{ans.gap}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global dossier actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 print:hidden">
          <Link href="/setup" className="flex-1 bg-[#6C47FF] hover:bg-[#5A3AE0] text-white text-center py-4 rounded-xl font-bold text-xs shadow-md shadow-purple-100 transition duration-200">
            Create New Assessment
          </Link>
          <Link href="/dashboard" className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-center py-4 rounded-xl font-bold text-xs border border-gray-200 transition duration-200">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}