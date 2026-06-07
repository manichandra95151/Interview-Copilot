"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

type Report = {
  overallScore: number; verdict: string; summary: string;
  strengths: string[]; gaps: string[]; redFlags: string[]; nextSteps: string[];
  competencies: Record<string, number>;
};

const VERDICT_MAP: Record<string, { label: string; icon: string; color: string; bg: string; border: string; text: string }> = {
  recommend_hire: { label:"Recommend Hire",    icon:"✓", color:"bg-green-600", bg:"bg-green-50",  border:"border-green-200", text:"text-green-800" },
  consider:       { label:"Consider Further",  icon:"○", color:"bg-amber-500", bg:"bg-amber-50",  border:"border-amber-200", text:"text-amber-800" },
  no_hire:        { label:"Do Not Proceed",    icon:"✕", color:"bg-red-500",   bg:"bg-red-50",    border:"border-red-200",   text:"text-red-800"   },
};

function VerdictBanner({ verdict, score }: { verdict: string; score: number }) {
  const v = VERDICT_MAP[verdict] || { label:"Under Review", icon:"⋯", color:"bg-gray-500", bg:"bg-gray-50", border:"border-gray-200", text:"text-gray-800" };
  return (
    <div className={`border rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${v.bg} ${v.border} shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md ${v.color}`}>{v.icon}</div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Candidate Evaluation Verdict</p>
          <p className={`text-xl font-extrabold mt-0.5 ${v.text}`}>{v.label}</p>
        </div>
      </div>
      <div className="text-center sm:text-right bg-white px-5 py-3 rounded-xl border border-white shadow-sm shrink-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Overall Score</p>
        <p className="text-2xl font-black text-gray-900">{score}<span className="text-sm text-gray-400 font-normal"> / 10</span></p>
      </div>
    </div>
  );
}

function CompetencyBar({ label, score }: { label: string; score: number }) {
  const color = score >= 8 ? "bg-green-500" : score >= 6 ? "bg-amber-500" : "bg-red-400";
  const text  = score >= 8 ? "text-green-700" : score >= 6 ? "text-amber-700" : "text-red-600";
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-500 font-medium capitalize min-w-[140px]">
        {label.replace(/([A-Z])/g, " $1").trim()}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full fill-bar ${color}`} style={{ width: `${score * 10}%` }}/>
      </div>
      <span className={`text-xs font-bold min-w-[40px] text-right ${text}`}>{score}/10</span>
    </div>
  );
}

function ScoreBadge({ score, skipped }: { score?: number | null; skipped?: boolean }) {
  if (skipped) return <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-lg bg-gray-100">Skipped</span>;
  if (score == null) return <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 rounded-lg bg-gray-100">N/A</span>;
  const cls = score >= 8 ? "bg-green-50 text-green-700 border-green-200" : score >= 6 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";
  return <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${cls}`}>{score}/10</span>;
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
    if (status === "unauthenticated") { setError("Please sign in to view this report."); setLoading(false); return; }
    if (!token) return;
    api.getReport(sessionId, token).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [sessionId, token, status]);

  const handleShare = async () => {
    if (!token) return; setSharing(true);
    try {
      let shareToken = data?.sessionMeta?.shareToken;
      if (!shareToken) {
        const res = await api.createShare(sessionId, token);
        shareToken = res.shareToken;
        setData((prev: any) => ({ ...prev, sessionMeta: { ...prev.sessionMeta, shareToken } }));
      }
      const link = window.location.origin + `/report/shared/${shareToken}`;
      await navigator.clipboard.writeText(link);
      setSharedLink(link);
      setTimeout(() => setSharedLink(""), 3000);
    } catch (e: any) { alert("Failed to share: " + e.message); }
    finally { setSharing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center">
      <div className="bg-white rounded-3xl border border-[#EDE9FF] p-8 max-w-sm w-full text-center shadow-xl shadow-purple-50 scale-in">
        <div className="relative w-14 h-14 mx-auto mb-5">
          <svg className="w-14 h-14" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="23" stroke="#EDE9FF" strokeWidth="4"/>
            <circle cx="28" cy="28" r="23" stroke="url(#lgr)" strokeWidth="4"
              strokeDasharray="144" strokeDashoffset="36" strokeLinecap="round"
              transform="rotate(-90 28 28)" className="spin"/>
            <defs><linearGradient id="lgr" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6C47FF"/><stop offset="100%" stopColor="#EC4899"/></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
          </div>
        </div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">Assembling Evaluation Dossier</h3>
        <p className="text-gray-400 text-xs">Compiling performance data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl border border-red-200 p-8 max-w-sm text-center shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500 text-xl">⚠</div>
        <p className="text-red-500 font-semibold text-sm mb-4">{error}</p>
        <Link href="/dashboard" className="text-[#6C47FF] text-xs font-bold hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  );

  const { report, sessionMeta, questions, answers } = data;
  const getAnswer = (qId: number) => answers?.find((a: any) => a.question_id == qId);

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-16">
      {/* Nav */}
      <nav className="bg-white border-b border-[#EDE9FF]/80 sticky top-0 z-20 shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-5 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white font-black text-xs">C</div>
            <span className="font-bold text-gray-900 text-[14px]">CopilotHire</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleShare}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm ${
                sharedLink ? "bg-green-600 text-white" : "bg-[#6C47FF] text-white hover:bg-[#5A3AE0]"
              }`}>
              {sharing ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spin"/>
              ) : sharedLink ? "✓ Copied!" : (
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M10 2l4 4-4 4M14 6H6a4 4 0 000 8h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              )}
              {sharing ? "Sharing..." : sharedLink ? "Link Copied" : "Share Dossier"}
            </button>
            <button onClick={() => window.print()}
              className="text-xs text-gray-600 border border-gray-200 bg-white px-3.5 py-2 rounded-xl hover:bg-gray-50 transition font-bold">
              Print
            </button>
            <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-gray-900 transition hidden sm:block ml-1">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 mt-7 space-y-5">

        {/* Candidate Header */}
        <div className="bg-white rounded-2xl border border-[#EDE9FF] p-5 shadow-sm fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl brand-gradient flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                {sessionMeta.candidate_name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">{sessionMeta.candidate_name}</h1>
                <p className="text-xs text-gray-400 font-semibold mt-0.5">{sessionMeta.role} · {sessionMeta.seniority}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400 sm:text-right space-y-1">
              <p>{new Date(sessionMeta.createdAt).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</p>
              <p className="font-bold text-[#6C47FF]">{sessionMeta.answersCount}/{sessionMeta.questionsCount} Evaluated</p>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="fade-up-1">
          <VerdictBanner verdict={report.verdict} score={report.overallScore}/>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm fade-up-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assessment Synthesis</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{report.summary}</p>
        </div>

        {/* Competencies */}
        {report.competencies && Object.keys(report.competencies).length > 0 && (
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm fade-up-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Target Competency Analysis</h2>
            <div className="space-y-4">
              {Object.entries(report.competencies).map(([key, val]) => (
                <CompetencyBar key={key} label={key} score={val as number}/>
              ))}
            </div>
          </div>
        )}

        {/* Strengths + Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">✓ Verified Strengths</h2>
            <ul className="space-y-3">
              {(report.strengths || []).map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-xs text-gray-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-lg bg-green-50 border border-green-200 text-green-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">△ Calibrated Gaps</h2>
            <ul className="space-y-3">
              {(report.gaps || []).map((g: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-xs text-gray-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black">△</span>
                  {g}
                </li>
              ))}
              {(!report.gaps || !report.gaps.length) && <li className="text-xs text-gray-400 italic">No significant gaps recorded.</li>}
            </ul>
          </div>
        </div>

        {/* Red Flags */}
        {report.redFlags && report.redFlags.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-4">⚠ Risk Assessment</h2>
            <ul className="space-y-2.5">
              {report.redFlags.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-xs text-red-700 leading-relaxed">
                  <span className="font-black text-red-500 shrink-0">•</span>{f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {report.nextSteps && report.nextSteps.length > 0 && (
          <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-4">Recommended Next Steps</h2>
            <ol className="space-y-3">
              {report.nextSteps.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
                  <span className="bg-blue-600/15 text-blue-700 text-[10px] font-black w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Q&A Audit Log */}
        <div className="bg-white rounded-2xl border border-[#EDE9FF] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/60 flex items-center gap-2">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-gray-400"><path d="M2 4h12M2 8h8M2 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Q&A Audit Log</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(questions || []).map((q: any, i: number) => {
              const ans = getAnswer(q.id);
              const borderColor = !ans || ans.skipped ? "border-gray-200" : (ans.score ?? 0) >= 7 ? "border-green-400" : (ans.score ?? 0) >= 5 ? "border-amber-400" : "border-red-400";
              return (
                <div key={q.id} className={`p-5 border-l-4 ${borderColor} hover:bg-[#F8F7FF] transition`}>
                  <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">Q{i+1}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border ${
                        q.category === "behavioral" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        q.category === "technical"  ? "bg-orange-50 text-orange-700 border-orange-200" :
                        "bg-gray-50 text-gray-600 border-gray-200"
                      }`}>{q.category}</span>
                    </div>
                    <ScoreBadge score={ans?.score} skipped={ans?.skipped}/>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 leading-snug">{q.question}</h4>
                  {ans?.transcript && !ans.skipped && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Candidate Transcript</p>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{ans.transcript}</p>
                    </div>
                  )}
                  {ans?.skipped && <p className="text-xs text-gray-400 italic">Question bypassed by interviewer.</p>}
                  {ans && !ans.skipped && (ans.strength || ans.gap) && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {ans.strength && (
                        <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-3">
                          <p className="text-[9px] font-black text-green-700 uppercase tracking-widest mb-1">Strength</p>
                          <p className="text-xs text-green-600 leading-relaxed">{ans.strength}</p>
                        </div>
                      )}
                      {ans.gap && (
                        <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Gap</p>
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

        {/* Bottom actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 print:hidden">
          <Link href="/setup" className="flex-1 bg-[#6C47FF] hover:bg-[#5A3AE0] text-white text-center py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-purple-200/50 transition">
            Create New Assessment →
          </Link>
          <Link href="/dashboard" className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-center py-3.5 rounded-2xl font-bold text-sm border border-gray-200 transition">
            Back to Dashboard
          </Link>
          <button onClick={handleShare}
            className={`flex-1 text-center py-3.5 rounded-2xl font-bold text-sm transition ${sharedLink ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}>
            {sharedLink ? "✓ Link Copied!" : "Share Report"}
          </button>
        </div>
      </div>
    </div>
  );
}