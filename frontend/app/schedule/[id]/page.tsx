"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAccessToken } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { api } from "@/lib/api";
import { Button, Card, Input, Spinner } from "@/components/ui";

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const token = useAccessToken();
  const toast = useToast();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [when, setWhen] = useState("");
  const [email, setEmail] = useState("");
  const [requireCode, setRequireCode] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.getSession(id, token)
      .then((s) => { setSession(s); if (s.candidate_email) setEmail(s.candidate_email); })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [id, token]);

  const submit = async () => {
    if (!token) return;
    if (sendEmail && !email) { toast("Add the candidate's email to send an invite", "error"); return; }
    setSaving(true);
    try {
      const res = await api.scheduleInterview(
        {
          sessionId: id,
          scheduledAt: when ? new Date(when).toISOString() : undefined,
          candidateEmail: email || undefined,
          requireCode,
          sendEmail: sendEmail && !!email,
        },
        token
      );
      setResult(res);
      if (res.email?.sent) toast("Invite sent to candidate", "success");
      else if (sendEmail && email && !res.gmailConfigured) toast("Scheduled — Gmail not configured, share the link manually", "info");
      else toast("Interview scheduled", "success");
    } catch (e: any) {
      toast(e.message || "Failed to schedule", "error");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!result?.joinUrl) return;
    navigator.clipboard.writeText(result.joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFAF7] flex items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <nav className="bg-white border-b border-[#ECE8DF] sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] brand-gradient flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-[#1A1A1A]">CopilotHire</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-[#6A665E] hover:text-[#1A1A1A]">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="mb-8 fade-up">
          <p className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.14em] mb-2">Schedule</p>
          <h1 className="text-[30px] font-semibold text-[#1A1A1A] tracking-tight leading-none">
            Invite <span className="accent-serif">{session?.candidate_name || "the candidate"}</span>
          </h1>
          <p className="text-[#6A665E] text-sm mt-2.5">
            {session?.role}{session?.seniority ? ` · ${session.seniority}` : ""}
          </p>
        </div>

        <Card className="p-6 fade-up">
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#6A665E] mb-1.5">Interview time</label>
              <input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E0DBCF] bg-white text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#4F46E5]"
              />
            </div>

            <Input
              type="email"
              label="Candidate email"
              placeholder="candidate@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              hint="We'll send a branded invite with the join link."
            />

            <div className="space-y-2.5 pt-1">
              <Toggle label="Require a 6-digit access code" desc="Adds a code the candidate must enter to join." checked={requireCode} onChange={setRequireCode} />
              <Toggle label="Email the invite now" desc="Send via Gmail. If not configured, you'll get a link to share." checked={sendEmail} onChange={setSendEmail} />
            </div>

            <Button onClick={submit} loading={saving} size="lg" className="w-full">
              {saving ? "Scheduling…" : "Schedule & send invite"}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6 mt-5 scale-in">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#E9F7EF] text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
              <h2 className="font-semibold text-[#1A1A1A]">Interview scheduled</h2>
            </div>

            <label className="block text-[11px] font-semibold text-[#9C978C] uppercase tracking-wide mb-1.5">Candidate join link</label>
            <div className="flex gap-2">
              <input readOnly value={result.joinUrl} className="flex-1 px-3 py-2 rounded-lg border border-[#E0DBCF] bg-[#FBFAF7] text-xs text-[#6A665E] truncate" />
              <Button size="sm" variant="secondary" onClick={copyLink}>{copied ? "Copied ✓" : "Copy"}</Button>
            </div>

            {result.joinCode && (
              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-[#9C978C] uppercase tracking-wide mb-1.5">Access code</label>
                <div className="text-2xl font-semibold tracking-[0.2em] text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>
                  {result.joinCode}
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-[#9C978C]">
              {result.email?.sent
                ? "✉️ Invite emailed to the candidate."
                : result.gmailConfigured === false
                ? "Gmail isn't configured yet — share the link (and code) with the candidate manually."
                : "Email not sent — share the link manually."}
            </div>

            <div className="mt-5 pt-4 border-t border-[#F1EEE6] flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>Back to dashboard</Button>
              <Button size="sm" onClick={() => router.push(`/interview/${id}`)}>Open interview room →</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 text-left rounded-xl border border-[#ECE8DF] p-3 hover:border-[#E0DBCF] transition"
    >
      <span className={`mt-0.5 w-9 h-5 rounded-full shrink-0 transition-colors relative ${checked ? "bg-[#4F46E5]" : "bg-[#E0DBCF]"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block text-sm font-medium text-[#1A1A1A]">{label}</span>
        <span className="block text-xs text-[#9C978C] mt-0.5">{desc}</span>
      </span>
    </button>
  );
}
