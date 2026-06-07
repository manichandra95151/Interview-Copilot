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
    desc: "Upload resumes and job parameters. Our AI generates 10 structured rubrics and tailored questions mapped to competencies like Behavioral and Technical.",
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
    desc: "Receive objective scores and detailed feedback highlighting key strengths and performance gaps for every candidate response.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Instant Panel Sharing",
    desc: "Generate secure, shareable public links in one click. Keep your hiring panel and HR teams aligned before the debrief.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Multi-category Filtering",
    desc: "Target the competencies that matter most: behavioral, situational, domain experience, functional, culture fit, or leadership.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Bypassed Question Detection",
    desc: "Unanswered or skipped questions are automatically flagged, ensuring crucial performance details never slip by unnoticed.",
  },
];

const steps = [
  { n: "01", title: "Input Criteria",        desc: "Upload the candidate's resume and paste the job description." },
  { n: "02", title: "Review Calibration",    desc: "AI generates 10 tailored questions mapped to specific rubrics." },
  { n: "03", title: "Conduct Live Session",  desc: "Present questions, record live responses, view instant scores." },
  { n: "04", title: "Share Assessment",      desc: "Publish and share the final evaluation report with the hiring team." },
];

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#F8F7FF] selection:bg-[#6C47FF]/20 selection:text-[#6C47FF]">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#EDE9FF]/80">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-black text-sm shadow-md shadow-purple-200/60">C</div>
            <span className="font-bold text-gray-900 tracking-tight text-[15px]">CopilotHire</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-gray-500">
            <a href="#features"    className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="bg-[#6C47FF] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#5A3AE0] transition shadow-lg shadow-purple-200/50">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/api/auth/signin" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition">Sign in</Link>
                <Link href="/api/auth/signin" className="bg-[#6C47FF] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#5A3AE0] transition shadow-lg shadow-purple-200/50">
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-bg pt-28 pb-20 px-5 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-[5%] w-72 h-72 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-[5%] w-56 h-56 bg-pink-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 border border-[#EDE9FF] text-[#6C47FF] text-[11px] font-bold px-4 py-1.5 rounded-full mb-7 tracking-widest uppercase shadow-sm fade-up">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C47FF] opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6C47FF]" />
            </span>
            Professional Interview Intelligence
          </div>

          <h1 className="text-5xl sm:text-[64px] font-extrabold text-gray-900 leading-[1.08] mb-5 tracking-tight fade-up-1">
            Configure your workspace.<br />
            <span className="gradient-text">Master the live interview.</span>
          </h1>

          <p className="text-[17px] text-gray-500 max-w-2xl mx-auto mb-9 leading-relaxed fade-up-2">
            Provide role context, candidate resumes, and configure target evaluation criteria.
            Then, conduct live sessions with real-time AI scoring and behavioral analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center fade-up-3">
            <Link href={session ? "/setup" : "/api/auth/signin"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6C47FF] text-white px-7 py-3.5 rounded-2xl text-[15px] font-bold hover:bg-[#5A3AE0] active:scale-[0.98] transition-all duration-200 shadow-xl shadow-purple-200/60">
              Start Free Session →
            </Link>
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-7 py-3.5 rounded-2xl text-[15px] font-bold border border-[#EDE9FF] hover:bg-gray-50 hover:border-[#D5CCFF] active:scale-[0.98] transition-all duration-200 shadow-sm">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-[#6C47FF]"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7l5 3-5 3V7z" fill="currentColor"/></svg>
              Watch Demo
            </button>
          </div>
        </div>

        {/* ── Hero Mockup ── */}
        <div className="max-w-4xl mx-auto mt-14 px-2 relative z-10 float fade-up-4">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#6C47FF]/20 via-purple-400/10 to-pink-400/10 blur-2xl" />
          <div className="relative bg-white rounded-2xl border border-[#EDE9FF] shadow-[0_24px_64px_rgba(108,71,255,0.14)] overflow-hidden">
            {/* Window chrome */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FC635D]"/><div className="w-3 h-3 rounded-full bg-[#FDBC40]"/><div className="w-3 h-3 rounded-full bg-[#35CD4B]"/>
              </div>
              <span className="mx-auto text-[11px] text-gray-400 font-mono">CopilotHire — Candidate Assessment Center</span>
            </div>
            <div className="grid grid-cols-12 divide-x divide-gray-50 min-h-[180px]">
              {/* Sidebar */}
              <div className="col-span-3 p-3 space-y-1">
                {[{l:"Question 3",a:true},{l:"Question 4"},{l:"Question 5"}].map((q,i)=>(
                  <div key={i} className={`px-2.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${q.a?"bg-[#EDE9FF] text-[#6C47FF]":"text-gray-400"}`}>
                    {q.a && <span className="w-1.5 h-1.5 bg-[#6C47FF] rounded-full rec-pulse"/>}
                    {q.l}
                  </div>
                ))}
              </div>
              {/* Center */}
              <div className="col-span-5 p-4">
                <span className="text-[9px] font-black text-[#6C47FF] bg-[#EDE9FF] px-2 py-0.5 rounded-full uppercase tracking-wider">Behavioral</span>
                <p className="text-sm font-bold text-gray-900 mt-2 leading-snug">Tell me about a time you had to manage a project through unexpected scope changes.</p>
                <div className="mt-3 bg-red-50/60 border border-red-100/60 rounded-xl p-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full rec-pulse"/>
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Live Transcription</span>
                  </div>
                  <p className="text-[11px] text-gray-600 italic leading-relaxed">"We had a major infrastructure change mid-project. I immediately set up a stakeholder alignment session, documented the scope changes, and calibrated expectations..."</p>
                </div>
              </div>
              {/* Right */}
              <div className="col-span-4 p-4 space-y-2.5">
                <div className="bg-[#EDE9FF]/60 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-[#6C47FF]">AI Verification</span>
                    <span className="text-sm font-black text-[#6C47FF]">8/10</span>
                  </div>
                  <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
                    <div className="h-full bg-[#6C47FF] rounded-full fill-bar" style={{width:"80%"}}/>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-[10px]">
                  <p className="font-bold text-green-700">✓ Strong documentation of change controls</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 text-[10px]">
                  <p className="font-bold text-blue-700">↗ Recommended: Follow up on stakeholder sync frequency</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-5 bg-white border-y border-[#EDE9FF]/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Enterprise-grade capabilities, built for speed</h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto">No complex configurations. Just an intuitive workspace to evaluate talent fairly and efficiently.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-[#F8F7FF] rounded-2xl p-6 border border-[#EDE9FF] card-lift step-enter"
                style={{animationDelay:`${i*60}ms`}}>
                <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE9FF] text-[#6C47FF] flex items-center justify-center mb-4 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-5 bg-[#F8F7FF] border-b border-[#EDE9FF]/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Structured assessment methodology</h2>
            <p className="text-base text-gray-500 max-w-xl mx-auto">Our 4-step workflow ensures every hire is evaluated with consistent, bias-free standards.</p>
          </div>

          {/* Steps with connecting lines */}
          <div className="relative">
            {/* Desktop connector line */}
            <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#6C47FF]/30 via-[#6C47FF]/60 to-[#6C47FF]/30 line-grow" style={{animationDelay:"0.2s"}}/>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center step-enter" style={{animationDelay:`${i*90}ms`}}>
                  <div className="relative w-12 h-12 rounded-full brand-gradient flex items-center justify-center text-white font-black text-sm mb-4 shadow-[0_6px_20px_rgba(108,71,255,0.35)] z-10">
                    {s.n}
                    {/* Ping ring on first */}
                    {i === 0 && <div className="absolute inset-0 rounded-full bg-[#6C47FF]/20 animate-ping"/>}
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1.5">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[160px]">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── V2 MATCHMAKING ── */}
      <section id="v2-spotlight" className="py-20 px-5 bg-white border-b border-[#EDE9FF]/60">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mb-5">
              ✦ COMING SOON IN V2
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
              Intelligent Candidate Matchmaking
            </h2>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Recruiting isn't just about interviews—it's about finding the right starting point. We're launching a smart matchmaking system that maps your entire candidate pool directly to open roles using advanced semantic search.
            </p>
            <div className="space-y-4">
              {[
                { title:"Resume Pool Ingestion", desc:"Upload folders of resumes. Our parser identifies achievements and career progressions instantly." },
                { title:"Evidence-Backed Recommendations", desc:"Using RAG (Retrieval-Augmented Generation), we highlight exactly why a candidate matches the role." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#EDE9FF] border border-[#6C47FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#6C47FF" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mock card */}
          <div className="bg-white border border-[#EDE9FF] rounded-2xl p-6 shadow-[0_8px_40px_rgba(108,71,255,0.1)] card-lift">
            <div className="brand-gradient rounded-xl p-4 mb-4 text-white flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Senior Product Designer</p>
                <p className="text-xs text-purple-200 mt-0.5">98% Match Probability</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">✦</div>
            </div>
            <div className="space-y-3">
              {[{w:85,c:"bg-[#6C47FF]"},{w:70,c:"bg-purple-400"},{w:92,c:"bg-[#6C47FF]"}].map((b,i)=>(
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0"/>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${b.c} rounded-full fill-bar`} style={{width:`${b.w}%`,animationDelay:`${i*100}ms`}}/>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{b.w}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-5 brand-gradient">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Want early access to V2 preview features?</h2>
          <p className="text-purple-200 text-sm mb-8 leading-relaxed max-w-lg mx-auto">
            No signups required. Keep using your current sessions, and your dashboard will automatically unlock the pilot matching module soon.
          </p>
          <Link href={session ? "/setup" : "/api/auth/signin"}
            className="inline-flex items-center gap-2 bg-white text-[#6C47FF] px-8 py-3.5 rounded-2xl text-[15px] font-black hover:bg-purple-50 active:scale-[0.98] transition-all shadow-lg">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-[#EDE9FF]/80 py-12 px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
              <span className="font-bold text-gray-900">CopilotHire</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-[180px]">Elevating recruitment standards through AI-driven calibration and empathetic assessment tools.</p>
          </div>
          {[
            { label: "Product",  links: ["Features", "Roadmap", "Pricing"] },
            { label: "Company",  links: ["About", "Careers"] },
            { label: "Legal",    links: ["Privacy", "Terms"] },
          ].map(col => (
            <div key={col.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{col.label}</p>
              <div className="space-y-2">
                {col.links.map(l => <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-900 transition">{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">© 2026 CopilotHire AI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-900 transition">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}