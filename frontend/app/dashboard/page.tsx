"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

function VerdictBadge({ verdict }: { verdict?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    recommend_hire: { label: "Recommend Hire", cls: "bg-green-100 text-green-700" },
    consider: { label: "Consider", cls: "bg-amber-100 text-amber-700" },
    no_hire: { label: "No Hire", cls: "bg-red-100 text-red-700" },
  };
  const v = map[verdict || ""] || { label: "Pending", cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${v.cls}`}>{v.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    setup: "bg-gray-100 text-gray-500",
    ready: "bg-blue-100 text-blue-700",
    active: "bg-orange-100 text-orange-700",
    completed: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.getSessions()
      .then(setSessions)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this interview session?")) return;
    setDeleting(id);
    try {
      await api.deleteSession(id);
      setSessions(s => s.filter(sess => sess.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === "completed").length,
    hires: sessions.filter(s => s.verdict === "recommend_hire").length,
    avgScore: sessions.filter(s => s.overallScore).length
      ? (sessions.filter(s => s.overallScore).reduce((a, s) => a + s.overallScore, 0) / sessions.filter(s => s.overallScore).length).toFixed(1)
      : "—",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
            <span className="font-semibold text-gray-900">InterviewAI</span>
          </Link>
          <Link href="/setup" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            + New Interview
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage and review all your interview sessions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Interviews", value: stats.total },
            { label: "Completed", value: stats.completed },
            { label: "Recommended Hire", value: stats.hires },
            { label: "Avg Score", value: stats.avgScore },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sessions */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading sessions...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 text-sm">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">🎙️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first interview session to get started</p>
            <Link href="/setup" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors">
              Start your first interview
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">All Sessions ({sessions.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {sessions.map(s => (
                <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">{s.candidate_name}</p>
                      <StatusBadge status={s.status} />
                      {s.verdict && <VerdictBadge verdict={s.verdict} />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{s.role}</span>
                      <span>·</span>
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      {s.overallScore && <><span>·</span><span className="font-medium text-gray-600">{s.overallScore}/10</span></>}
                      {s.questionsCount > 0 && <><span>·</span><span>{s.answersCount}/{s.questionsCount} answered</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status === "ready" || s.status === "active" ? (
                      <Link href={`/interview/${s.id}`} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                        Continue →
                      </Link>
                    ) : s.status === "completed" ? (
                      <Link href={`/report/${s.id}`} className="text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                        View Report →
                      </Link>
                    ) : (
                      <Link href={`/setup`} className="text-xs text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        Setup
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-2 rounded-lg transition-colors"
                    >
                      {deleting === s.id ? "..." : "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}