"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" strokeLinecap="round"/>
      </svg>
    ),
    title: "Workspace Configuration",
    desc: "Upload resumes and job parameters. Our AI generates 10 structured rubrics and tailored questions mapped to specific competencies like Behavioral and Technical skills.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Live Interview Copilot",
    desc: "Record sessions directly. Get real-time feedback analysis, calibrated verdicts, and follow-up recommendations based on live candidate transcripts.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round"/>
      </svg>
    ),
    title: "Calibrated Verdicts",
    desc: "Receive objective scores and detailed feedback analysis highlighting key strengths and performance gaps for every candidate response.",
  },
];

const steps = [
  { n: "01", title: "Input Criteria",       desc: "Upload candidate's resume and paste the job description to define role parameters." },
  { n: "02", title: "Review Calibration",   desc: "The platform generates 10 tailored questions mapped to specific candidate rubrics." },
  { n: "03", title: "Conduct Live Session", desc: "Present questions one by one, record responses, and view real-time scores." },
  { n: "04", title: "Share Assessment",     desc: "Publish and share the final structured evaluation report with the hiring team." },
];

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-[Inter,system-ui,sans-serif]">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5"/>
                <path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-[#0F172A] text-[15px] tracking-tight">CopilotHire</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#475569]">
            <a href="#features" className="hover:text-[#0F172A] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] transition">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/api/auth/signin" className="text-sm font-medium text-[#475569] hover:text-[#0F172A] transition">Sign in</Link>
                <Link href="/api/auth/signin" className="bg-[#1D4ED8] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1E40AF] transition">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="hero-badge mb-6 anim-fade-up">
            <span className="w-1.5 h-1.5 bg-[#1D4ED8] rounded-full dot-blink"/>
            Professional Interview Intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-[#0F172A] leading-[1.1] tracking-tight mb-5 anim-fade-up-1">
            Configure your workspace.<br/>
            <span className="text-[#1D4ED8]">Master the live interview.</span>
          </h1>

          <p className="text-[17px] text-[#475569] max-w-2xl mx-auto leading-relaxed mb-8 anim-fade-up-2">
            Provide role context, candidate resumes, and configure target evaluation criteria. Then, conduct live sessions with real-time AI scoring and behavioral analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center anim-fade-up-3">
            <Link href={session ? "/setup" : "/api/auth/signin"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-7 py-3.5 rounded-lg text-[15px] font-semibold transition-all active:scale-[0.98]">
              Start Free Session →
            </Link>
            <Link href="/api/auth/signin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#0F172A] px-7 py-3.5 rounded-lg text-[15px] font-semibold border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all">
              Watch Demo
            </Link>
          </div>
        </div>

        {/* Mockup preview */}
        <div className="max-w-4xl mx-auto mt-14 anim-fade-up-4 anim-float">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_40px_rgba(15,23,42,0.10)] overflow-hidden">
            {/* Window chrome */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FC635D]"/>
                <div className="w-3 h-3 rounded-full bg-[#FDBC40]"/>
                <div className="w-3 h-3 rounded-full bg-[#35CD4B]"/>
              </div>
              <span className="mx-auto text-[11px] text-[#94A3B8] font-mono">CopilotHire — Candidate Assessment Center</span>
            </div>
            {/* Mock content */}
            <div className="grid grid-cols-12 divide-x divide-[#F1F5F9]">
              {/* Sidebar */}
              <div className="col-span-3 p-3 space-y-1.5">
                {["Question 3", "Question 4", "Question 5"].map((q, i) => (
                  <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${i===0?"bg-[#EFF6FF] text-[#1D4ED8]":"text-[#94A3B8]"}`}>
                    {i===0 && <span className="w-1.5 h-1.5 bg-[#1D4ED8] rounded-full"/>}
                    {q}
                  </div>
                ))}
              </div>
              {/* Center */}
              <div className="col-span-5 p-4">
                <span className="text-[10px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded-full uppercase tracking-wide">Behavioral</span>
                <p className="text-sm font-bold text-[#0F172A] mt-2.5 leading-snug">Tell me about a time you had to manage a project through unexpected scope changes.</p>
                <div className="mt-3 bg-[#FEF2F2] border border-[#FECACA]/50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full dot-blink"/>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live Transcription</span>
                  </div>
                  <p className="text-xs text-[#475569] italic leading-relaxed">"We had a major infrastructure change mid-project. I immediately set up a stakeholder alignment session, documented the scope changes, and calibrated expectations..."</p>
                </div>
              </div>
              {/* Right panel */}
              <div className="col-span-4 p-4">
                <div className="bg-[#EFF6FF] rounded-xl p-3 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-[#1D4ED8]">AI Verification</span>
                    <span className="text-sm font-black text-[#1D4ED8]">8/10</span>
                  </div>
                  <div className="h-1.5 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-[#1D4ED8] rounded-full anim-bar-fill" style={{width:"80%"}}/>
                  </div>
                </div>
                <div className="space-y-2 text-[10px]">
                  <div className="bg-[#F0FDF4] border border-[#BBF7D0]/50 rounded-lg p-2.5">
                    <p className="font-bold text-green-800 mb-0.5">✓ Strong documentation of change controls</p>
                  </div>
                  <div className="bg-[#EFF6FF] border border-[#BFDBFE]/50 rounded-lg p-2.5">
                    <p className="font-bold text-blue-800 mb-0.5">↗ Recommended: Follow up on stakeholder sync frequency</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-6 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">Enterprise-grade capabilities, built for speed</h2>
            <p className="text-[#475569] text-base">No complex configurations. Just an intuitive workspace to evaluate talent fairly and efficiently.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card card-hover p-6" style={{animationDelay:`${i*80}ms`}}>
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#0F172A] text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm text-[#475569] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-3">Structured assessment methodology</h2>
            <p className="text-[#475569] text-base">Our 4-step workflow ensures every hire is evaluated with consistent, bias-free standards.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-start">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center anim-fade-up" style={{animationDelay:`${i*90}ms`}}>
                <div className="w-12 h-12 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white font-black text-sm mb-4 shadow-[0_4px_16px_rgba(29,78,216,0.28)]">
                  {s.n}
                </div>
                <p className="font-bold text-[#0F172A] text-sm mb-1.5">{s.title}</p>
                <p className="text-xs text-[#475569] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── V2 MATCHMAKING ── */}
      <section id="v2-spotlight" className="py-20 px-6 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-5">
              ✦ COMING SOON IN V2
            </span>
            <h2 className="text-4xl font-extrabold text-[#0F172A] leading-tight tracking-tight mb-5">
              Intelligent Candidate Matchmaking
            </h2>
            <p className="text-[#475569] text-base leading-relaxed mb-8">
              Recruiting isn't just about interviews—it's about finding the right starting point. We're launching a smart matchmaking system that maps your entire candidate pool directly to open roles using advanced semantic search.
            </p>
            <div className="space-y-4">
              {[
                { title:"Resume Pool Ingestion", desc:"Upload folders of resumes. Our parser identifies achievements and career progressions instantly." },
                { title:"Evidence-Backed Recommendations", desc:"Using RAG (Retrieval-Augmented Generation), we highlight exactly why a candidate matches the role." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center shrink-0 mt-0.5">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">{item.title}</p>
                    <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mock card */}
          <div className="card p-6 shadow-[0_8px_32px_rgba(15,23,42,0.08)]">
            <div className="bg-[#1D4ED8] rounded-xl p-4 mb-4 text-white flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Senior Product Designer</p>
                <p className="text-xs text-blue-200 mt-0.5">98% Match Probability</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 1l1.8 3.6L14 5.4l-3 2.9.7 4.1L8 10.5l-3.7 1.9.7-4.1-3-2.9 4.2-.8z" fill="white"/></svg>
              </div>
            </div>
            <div className="space-y-2.5">
              {[85, 70, 92].map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F1F5F9] shrink-0"/>
                  <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1D4ED8] rounded-full anim-bar-fill" style={{width:`${w}%`,animationDelay:`${i*100}ms`}}/>
                  </div>
                  <span className="text-xs font-bold text-[#475569]">{w}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-6 bg-[#1D4ED8]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Want early access to V2 preview features?</h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            No signups required. Keep using your current sessions, and your dashboard will automatically unlock the pilot matching module soon.
          </p>
          <Link href={session ? "/setup" : "/api/auth/signin"}
            className="inline-flex items-center gap-2 bg-white text-[#1D4ED8] px-8 py-3.5 rounded-lg text-[15px] font-bold hover:bg-blue-50 transition active:scale-[0.98]">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#E2E8F0] py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1D4ED8] flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span className="font-bold text-[#0F172A] text-sm">CopilotHire</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">Elevating recruitment standards through AI-driven calibration and empathetic assessment tools.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">Product</p>
            <div className="space-y-2">
              {["Features","Roadmap","Pricing"].map(l=>(
                <a key={l} href="#" className="block text-sm text-[#475569] hover:text-[#0F172A] transition">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">Company</p>
            <div className="space-y-2">
              {["About","Careers"].map(l=>(
                <a key={l} href="#" className="block text-sm text-[#475569] hover:text-[#0F172A] transition">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">Legal</p>
            <div className="space-y-2">
              {["Privacy","Terms"].map(l=>(
                <a key={l} href="#" className="block text-sm text-[#475569] hover:text-[#0F172A] transition">{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-[#F1F5F9]">
          <p className="text-xs text-[#94A3B8]">© 2026 CopilotHire AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}