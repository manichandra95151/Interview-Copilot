"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";
import { Reveal } from "@/components/Reveal";
import { ScrollStory } from "@/components/landing/ScrollStory";

const EASE = [0.22, 1, 0.36, 1] as const;

const capabilities = [
  { t: "RAG resume matching", d: "Rank any pool against a role with evidence." },
  { t: "Tailored questions", d: "Role-aware prompts across six competencies." },
  { t: "Live voice copilot", d: "Real-time transcription, scoring, follow-ups." },
  { t: "Calibrated reports", d: "Defensible verdicts, shareable in one click." },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBFAF7] text-[#1A1A1A] selection:bg-[#4F46E5]/15">
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-[#ECE8DF]/70">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] brand-gradient flex items-center justify-center text-white font-black text-sm shadow-sm">C</div>
            <span className="font-semibold tracking-tight text-[15px]">CopilotHire</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="bg-[#4F46E5] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#4338CA] transition shadow-sm">
                Go to dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-[#6A665E] hover:text-[#1A1A1A] transition px-2">Sign in</Link>
                <Link href="/signup" className="bg-[#4F46E5] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#4338CA] transition shadow-sm">
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-bg pt-36 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-24 left-[6%] w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-44 right-[8%] w-64 h-64 bg-amber-200/20 rounded-full blur-3xl pointer-events-none float" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
            className="inline-flex items-center gap-2 bg-white border border-[#ECE8DF] text-[#6A665E] text-[11px] font-semibold px-3.5 py-1.5 rounded-full mb-8 tracking-[0.12em] uppercase shadow-sm"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F46E5] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4F46E5]" />
            </span>
            Interview intelligence for hiring teams
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            className="text-[2.75rem] sm:text-6xl font-semibold leading-[1.04] mb-6"
          >
            Hire with the <span className="accent-serif">clarity</span>
            <br className="hidden sm:block" /> of a second set of eyes.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
            className="text-[17px] text-[#6A665E] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            CopilotHire matches resumes to your role, drafts the right questions, and sits
            beside you in the live interview — transcribing, scoring, and surfacing what matters,
            so you can focus on the conversation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.24 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link href={user ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4F46E5] text-white px-7 py-3.5 rounded-xl text-[15px] font-semibold hover:bg-[#4338CA] active:scale-[0.98] transition-all shadow-sm shadow-indigo-900/10">
              Start free session →
            </Link>
            <a href="#how"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#1A1A1A] px-7 py-3.5 rounded-xl text-[15px] font-medium border border-[#E0DBCF] hover:border-[#C9C2B2] active:scale-[0.98] transition-all shadow-sm">
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Hero mockup */}
        <motion.div
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.34 }}
          className="max-w-4xl mx-auto mt-16 relative z-10"
        >
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-[#4F46E5]/10 via-transparent to-[#E8A33D]/10 blur-2xl" />
          <div className="relative bg-white rounded-2xl border border-[#ECE8DF] shadow-[0_30px_60px_-30px_rgba(26,26,26,0.25)] overflow-hidden">
            <div className="bg-[#FBFAF7] border-b border-[#ECE8DF] px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#E0DBCF]" /><div className="w-3 h-3 rounded-full bg-[#E0DBCF]" /><div className="w-3 h-3 rounded-full bg-[#E0DBCF]" />
              </div>
              <span className="mx-auto text-[11px] text-[#9C978C] font-medium tracking-wide">Live interview — Senior Product Designer</span>
            </div>
            <div className="grid grid-cols-12 divide-x divide-[#F1EEE6] min-h-[220px]">
              <div className="col-span-3 p-4 space-y-1.5">
                {[{ l: "Question 3", a: true }, { l: "Question 4" }, { l: "Question 5" }].map((q, i) => (
                  <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${q.a ? "bg-[#EEF0FF] text-[#4F46E5]" : "text-[#9C978C]"}`}>
                    {q.a && <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full rec-pulse" />}
                    {q.l}
                  </div>
                ))}
              </div>
              <div className="col-span-5 p-5">
                <span className="text-[9px] font-bold text-[#4F46E5] bg-[#EEF0FF] px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">Behavioral</span>
                <p className="text-sm font-semibold mt-2.5 leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                  Tell me about a time you navigated a major scope change mid-project.
                </p>
                <div className="mt-3.5 bg-[#FBFAF7] border border-[#ECE8DF] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full rec-pulse" />
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-[0.1em]">Live transcription</span>
                  </div>
                  <p className="text-[11px] text-[#6A665E] italic leading-relaxed">&quot;We had an infrastructure shift mid-project. I ran a stakeholder alignment session, documented the new scope, and recalibrated the timeline…&quot;</p>
                </div>
              </div>
              <div className="col-span-4 p-5 space-y-2.5">
                <div className="bg-[#EEF0FF] rounded-xl p-3.5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-semibold text-[#4F46E5] uppercase tracking-wide">AI assessment</span>
                    <span className="text-base font-bold text-[#4F46E5]" style={{ fontFamily: "var(--font-display)" }}>8/10</span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full fill-bar" style={{ width: "80%" }} />
                  </div>
                </div>
                <div className="bg-[#E9F7EF] border border-green-100 rounded-xl p-2.5 text-[10px]">
                  <p className="font-semibold text-green-700">✓ Strong change-management instincts</p>
                </div>
                <div className="bg-[#FBF2DF] border border-amber-100 rounded-xl p-2.5 text-[10px]">
                  <p className="font-semibold text-[#92610F]">↗ Follow up on stakeholder cadence</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── SCROLL STORY (centerpiece) ── */}
      <div id="how">
        <ScrollStory />
      </div>

      {/* ── CAPABILITY STRIP ── */}
      <section className="py-20 px-6 bg-[#FBFAF7]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-xl mb-12">
            <p className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.14em] mb-3">In the box</p>
            <h2 className="text-3xl font-semibold tracking-tight">Everything the interview needs, <span className="amber-serif">nothing it doesn&apos;t</span>.</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#ECE8DF] border-y border-[#ECE8DF]">
            {capabilities.map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06} className="py-7 sm:px-6 first:sm:pl-0">
                <div className="w-8 h-8 rounded-lg bg-[#EEF0FF] flex items-center justify-center mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                </div>
                <h3 className="text-[17px] font-semibold mb-1.5">{c.t}</h3>
                <p className="text-sm text-[#6A665E] leading-relaxed">{c.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-[#FBFAF7]">
        <Reveal className="max-w-3xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl brand-gradient px-8 py-16 text-center">
            <div className="absolute inset-0 grid-texture opacity-20" />
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#E8A33D]/20 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-[40px] font-semibold text-white mb-4 tracking-tight leading-tight">Run your next interview<br className="hidden sm:block" /> with a copilot.</h2>
              <p className="text-indigo-100 text-[15px] mb-9 leading-relaxed max-w-lg mx-auto">
                Free to start. No setup theater — upload a resume, paste a role, and go.
              </p>
              <Link href={user ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 bg-white text-[#4F46E5] px-8 py-3.5 rounded-xl text-[15px] font-semibold hover:bg-[#FBFAF7] active:scale-[0.98] transition-all shadow-lg">
                Get started free →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#ECE8DF] py-14 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
              <span className="font-semibold">CopilotHire</span>
            </div>
            <p className="text-xs text-[#9C978C] leading-relaxed max-w-[260px]">Calm, intelligent interview tooling for teams who take hiring seriously.</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#6A665E]">
            <a href="#" className="hover:text-[#1A1A1A] transition">Privacy</a>
            <a href="#" className="hover:text-[#1A1A1A] transition">Terms</a>
            {!user && <Link href="/signup" className="text-[#4F46E5] font-medium hover:underline">Start free →</Link>}
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-[#ECE8DF]">
          <p className="text-xs text-[#9C978C]">© 2026 CopilotHire. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
