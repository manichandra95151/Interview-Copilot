"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

const VERDICT_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  recommend_hire: { label: "Hire",     cls: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  consider:       { label: "Consider", cls: "bg-amber-100 text-amber-700",  dot: "bg-amber-500" },
  no_hire:        { label: "No Hire",  cls: "bg-red-100 text-red-700",      dot: "bg-red-500"   },
};

const STATUS_CONFIG: Record<string, string> = {
  setup: "bg-gray-100 text-gray-500", ready: "bg-blue-100 text-blue-600",
  active: "bg-orange-100 text-orange-600", completed: "bg-green-100 text-green-700",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = (session as any)?._token;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!token) return;
    api.getSessions(token).then(setSessions).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  const filtered = sessions.filter(s => {
    const matchSearch = s.candidate_name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || s.status === filter || s.verdict === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total:     sessions.length,
    completed: sessions.filter(s => s.status === "completed").length,
    hires:     sessions.filter(s => s.verdict === "recommend_hire").length,
    avg:       sessions.filter(s => s.overallScore).length
               ? (sessions.reduce((a, s) => a + (s.overallScore || 0), 0) / sessions.filter(s => s.overallScore).length).toFixed(1)
               : "—",
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Nav */}
      <nav className="bg-white border-b border-purple-50 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-gray-900">CopilotHire</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/setup" className="bg-[#6C47FF] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#5A3AE0] transition font-medium shadow-lg shadow-purple-200">
              + New Interview
            </Link>
            {session?.user && (
              <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
                <img src={session.user.image || ''} className="w-8 h-8 rounded-full border-2 border-purple-100" alt="" />
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-gray-900 leading-none">{session.user.name?.split(' ')[0]}</p>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="text-xs text-gray-400 hover:text-gray-600 transition mt-0.5">Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">All your interview sessions in one place</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, icon: "🎙️" },
            { label: "Completed", value: stats.completed, icon: "✅" },
            { label: "Recommended Hire", value: stats.hires, icon: "⭐" },
            { label: "Avg Score", value: `${stats.avg}/10`, icon: "📊" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#EDE9FF] p-5 card-lift">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by candidate or role..."
            className="flex-1 border border-[#EDE9FF] rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition"
          />
          <div className="flex gap-2 flex-wrap">
            {[
              ["all", "All"], ["completed", "Completed"], ["active", "In progress"],
              ["recommend_hire", "Hire ✓"], ["no_hire", "No hire"],
            ].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-xs px-3 py-2 rounded-xl border transition font-medium ${filter === v ? 'bg-[#6C47FF] text-white border-[#6C47FF]' : 'bg-white border-[#EDE9FF] text-gray-600 hover:border-[#6C47FF] hover:text-[#6C47FF]'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3 animate-pulse">🎙️</div>
            <p className="text-sm">Loading sessions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-16 text-center">
            <div className="text-5xl mb-4">🗂️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{sessions.length === 0 ? "No interviews yet" : "No matches"}</h3>
            <p className="text-gray-400 text-sm mb-6">{sessions.length === 0 ? "Create your first interview session to get started" : "Try a different search or filter"}</p>
            {sessions.length === 0 && (
              <Link href="/setup" className="bg-[#6C47FF] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-[#5A3AE0] transition">
                Start your first interview →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EDE9FF] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{filtered.length} session{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(s => {
                const vc = VERDICT_CONFIG[s.verdict || ""];
                return (
                  <div key={s.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-[#F8F7FF] transition group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 truncate">{s.candidate_name}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CONFIG[s.status] || "bg-gray-100 text-gray-500"}`}>
                          {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                        </span>
                        {vc && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5 ${vc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${vc.dot}`}/>
                            {vc.label}
                          </span>
                        )}
                        {s.shareToken && <span className="text-xs text-purple-500 font-medium">🔗 Shared</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                        <span>{s.role}</span>
                        <span>·</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                        {s.overallScore && <><span>·</span><span className="font-semibold text-gray-600">{s.overallScore}/10</span></>}
                        {s.questionsCount > 0 && <><span>·</span><span>{s.answersCount}/{s.questionsCount} answered</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.status === "completed" ? (
                        <Link href={`/report/${s.id}`} className="text-xs bg-[#6C47FF] text-white px-4 py-2 rounded-xl hover:bg-[#5A3AE0] transition font-medium">
                          View Report →
                        </Link>
                      ) : (s.status === "ready" || s.status === "active") ? (
                        <Link href={`/interview/${s.id}`} className="text-xs bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition font-medium">
                          Continue →
                        </Link>
                      ) : (
                        <Link href="/setup" className="text-xs text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
                          Setup
                        </Link>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this session?")) return;
                          await api.deleteSession(s.id, token);
                          setSessions(prev => prev.filter(x => x.id !== s.id));
                        }}
                        className="text-gray-300 hover:text-red-400 transition text-xs px-2 py-2 rounded-lg"
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}