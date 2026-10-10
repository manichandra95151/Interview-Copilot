"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useAccessToken } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { api } from "@/lib/api";
import { Button, Card, Input, Spinner, Skeleton } from "@/components/ui";
import { ResumeUploader } from "@/components/candidates/ResumeUploader";
import { MatchCard, type Match } from "@/components/candidates/MatchCard";

type Candidate = { id: string; name: string; email?: string | null; created_at: string };

export default function CandidatesPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const token = useAccessToken();
  const toast = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [jdText, setJdText] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("Mid-level");
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);

  const load = () => {
    if (!token) return;
    api.getCandidates(token).then(setCandidates).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const runMatch = async () => {
    if (!token) return;
    if (jdText.trim().length < 20) {
      toast("Paste a job description (at least 20 characters)", "error");
      return;
    }
    if (!candidates.length) {
      toast("Upload some resumes first", "error");
      return;
    }
    setMatching(true);
    setMatches(null);
    try {
      const res = await api.matchCandidates(jdText, role, seniority, token);
      setMatches(res.results);
      if (!res.results.length) toast("No matches found", "info");
    } catch (e: any) {
      toast(e.message || "Matching failed", "error");
    } finally {
      setMatching(false);
    }
  };

  const remove = async (id: string) => {
    if (!token || !confirm("Remove this candidate?")) return;
    try {
      await api.deleteCandidate(id, token);
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      setMatches((prev) => prev?.filter((m) => m.candidateId !== id) ?? null);
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#ECE8DF] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-gray-900">CopilotHire</span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <Link href="/dashboard" className="px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium">Dashboard</Link>
            <Link href="/candidates" className="px-3 py-2 rounded-lg text-[#4F46E5] bg-[#EEF0FF] font-semibold">Candidates</Link>
            <button
              onClick={async () => { await signOut(); router.push("/login"); router.refresh(); }}
              className="ml-2 text-xs text-gray-400 hover:text-red-500 transition font-medium px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8 fade-up">
          <p className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.14em] mb-2">Matching</p>
          <h1 className="text-[32px] font-semibold text-[#1A1A1A] tracking-tight leading-none">
            Find your <span className="accent-serif">shortlist</span>.
          </h1>
          <p className="text-[#6A665E] text-sm mt-2.5">
            Upload a resume pool, paste a role, and let AI rank candidates with evidence.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: pool + upload */}
          <div className="lg:col-span-2 space-y-5">
            <ResumeUploader token={token || ""} onUploaded={load} />

            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F1EEE6] flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm">Resume Pool</h2>
                <span className="text-xs text-gray-400">{candidates.length}</span>
              </div>
              <div className="max-h-[420px] overflow-y-auto divide-y divide-[#F1EEE6]">
                {loading ? (
                  <div className="p-5 space-y-3">
                    {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : candidates.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-400">No candidates yet</p>
                ) : (
                  candidates.map((c) => (
                    <div key={c.id} className="px-5 py-3 flex items-center justify-between group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-gray-300 hover:text-red-400 transition text-xs px-2 opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right: JD + results */}
          <div className="lg:col-span-3 space-y-5">
            <Card>
              <h2 className="font-bold text-gray-900 text-sm mb-4">Match against a role</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <Input label="Role" placeholder="e.g. Senior Backend Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Seniority</label>
                  <select
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECE8DF] bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5]"
                  >
                    {["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Director"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Job description</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
                placeholder="Paste the job description and key requirements…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#ECE8DF] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5] resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button onClick={runMatch} loading={matching}>
                  {matching ? "Ranking candidates…" : "Rank candidates →"}
                </Button>
              </div>
            </Card>

            {matching && (
              <div className="flex items-center justify-center gap-3 py-10 text-gray-400 text-sm">
                <Spinner /> Embedding the role and ranking with Claude…
              </div>
            )}

            {matches && matches.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {matches.length} ranked candidate{matches.length > 1 ? "s" : ""}
                </p>
                {matches.map((m, i) => (
                  <MatchCard key={m.candidateId} match={m} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
