"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";

const features = [
  { 
    icon: "⚡", 
    title: "Instant Calibration", 
    desc: "Simply drop a resume and job description. Within seconds, our AI calibrates the role seniority and drafts 10 high-impact, rubric-aligned interview questions." 
  },
  { 
    icon: "🎙️", 
    title: "Active Transcript Scoring", 
    desc: "Record the conversation directly in-app. The platform transcribes responses live and scores them 1-10 against candidate-specific rubrics with real-time feedback." 
  },
  { 
    icon: "📊", 
    title: "Insight Analytics", 
    desc: "Generate comprehensive candidate profiles with competency radars, strengths, performance gaps, and evidence-backed hiring verdicts." 
  },
  { 
    icon: "🔗", 
    title: "Instant Panel Sharing", 
    desc: "Generate secure, shareable public links in a single click. Keep your hiring panel, stakeholders, and HR teams aligned before the debrief." 
  },
  { 
    icon: "🎯", 
    title: "Multi-category Filtering", 
    desc: "Target the competencies that matter most. Easily select and test behavioral, situational, domain experience, functional, culture fit, or leadership." 
  },
  { 
    icon: "🧠", 
    title: "Bypassed Question Detection", 
    desc: "Unanswered or skipped questions are automatically flagged and analyzed, ensuring crucial performance details never slip by unnoticed." 
  },
];

const steps = [
  { n: "01", title: "Input Criteria", desc: "Upload the candidate's resume and paste the job description to define the role parameters." },
  { n: "02", title: "Review Calibration", desc: "The platform generates 10 tailored questions mapped to specific candidate-fit rubrics." },
  { n: "03", title: "Conduct Live Session", desc: "Present questions one by one, record live responses, and view instant score evaluations." },
  { n: "04", title: "Share Assessment", desc: "Instantly publish and share the final structured evaluation report with the hiring team." },
];

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#F8F7FF] selection:bg-[#6C47FF]/20 selection:text-[#6C47FF]">
      {/* Premium Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#EDE9FF]/80">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-100">C</div>
            <span className="font-bold text-gray-900 tracking-tight text-lg">CopilotHire</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Platform Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">Methodology</a>
            <a href="#v2-spotlight" className="hover:text-gray-900 transition-colors">V2 Roadmap</a>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="bg-[#6C47FF] text-white text-sm px-4.5 py-2.5 rounded-xl hover:bg-[#5A3AE0] transition duration-200 font-semibold shadow-lg shadow-purple-200/50">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/api/auth/signin" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition mr-2">Sign in</Link>
                <Link href="/api/auth/signin" className="bg-[#6C47FF] text-white text-sm px-4.5 py-2.5 rounded-xl hover:bg-[#5A3AE0] transition duration-200 font-semibold shadow-lg shadow-purple-200/50">
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg pt-36 pb-24 px-5 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#EDE9FF] text-[#6C47FF] text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase shadow-sm">
            <span className="w-1.5 h-1.5 bg-[#6C47FF] rounded-full animate-pulse"></span>
            Professional Interview Intelligence
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Structure your interviews.<br />
            <span className="gradient-text">Calibrate your hires.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
            The intelligent candidate evaluation copilot designed for modern teams. Calibrate seniority, generate custom rubrics, transcribe answers live, and deliver objective feedback in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={session ? "/setup" : "/api/auth/signin"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6C47FF] text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-[#5A3AE0] hover:scale-[1.02] active:scale-[0.98] transition duration-200 shadow-xl shadow-purple-200">
              Start Free Session →
            </Link>
            {!session && (
              <Link href="/api/auth/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl text-base font-bold border border-[#EDE9FF] hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition duration-200">
                Continue with Google
              </Link>
            )}
          </div>
        </div>

        {/* Floating Mockup Preview */}
        <div className="max-w-5xl mx-auto mt-20 relative z-10 group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl border border-[#EDE9FF] overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
              <span className="mx-auto text-xs text-gray-400 font-mono">CopilotHire — Candidate Assessment Center</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Question list sidebar */}
              <div className="md:col-span-1 space-y-2">
                {[{n:1,s:'done',score:9},{n:2,s:'done',score:7},{n:3,s:'active'},{n:4,s:'pending'},{n:5,s:'pending'}].map(q => (
                  <div key={q.n} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${q.s==='active' ? 'bg-[#EDE9FF] text-[#6C47FF]' : 'hover:bg-gray-50 text-gray-500'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      q.s==='done' && (q.score||0)>=8 ? 'bg-green-100 text-green-700' :
                      q.s==='done' ? 'bg-amber-100 text-amber-700' :
                      q.s==='active' ? 'bg-[#6C47FF] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>{q.s==='done'?(q.score||'✓'):q.n}</div>
                    <div className="flex-1 font-medium">Question {q.n}</div>
                  </div>
                ))}
              </div>
              {/* Live transcript area */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-[#F8F7FF] rounded-xl p-4 border border-[#EDE9FF]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] bg-[#EDE9FF] text-[#6C47FF] font-bold px-2 py-0.5 rounded-full">Q3 · Behavioral</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 leading-relaxed">Tell me about a time you had to manage a project through unexpected scope changes. How did you keep stakeholders aligned?</p>
                </div>
                <div className="bg-red-50/50 border border-red-100/50 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Live Transcription</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed italic">"We had a major infrastructure change mid-project. I immediately set up a stakeholder alignment session, documented the scope changes, and calibrated expectations..."</p>
                </div>
              </div>
              {/* AI scoring card */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-[#EDE9FF] rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-500 uppercase">AI Verification</span>
                    <span className="text-sm font-extrabold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg">8 / 10</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3.5 overflow-hidden">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{width:'80%'}}/>
                  </div>
                  <div className="space-y-2.5">
                    <div className="bg-green-50/70 rounded-xl px-3 py-2 border border-green-100/30">
                      <p className="text-[10px] font-bold text-green-800">✓ Detected Strength</p>
                      <p className="text-[10px] text-green-600 leading-relaxed mt-0.5">Structured documentation of change controls and immediate stakeholder syncs.</p>
                    </div>
                    <div className="bg-blue-50/70 rounded-xl px-3 py-2 border border-blue-100/30">
                      <p className="text-[10px] font-bold text-blue-800">💡 Recommended Follow-up</p>
                      <p className="text-[10px] text-blue-600 leading-relaxed mt-0.5 italic">"What metrics did you track to confirm stakeholders remained aligned?"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section id="features" className="py-24 px-5 bg-white border-y border-[#EDE9FF]/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Enterprise-grade capabilities, built for speed</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">No complex configurations. Just an intuitive workspace to evaluate talent fairly and efficiently.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-[#F8F7FF] rounded-2xl p-6 border border-[#EDE9FF] card-lift group">
                <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110 inline-block">{f.icon}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="how-it-works" className="py-24 px-5 bg-[#F8F7FF] border-b border-[#EDE9FF]/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Structured assessment methodology</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-[#EDE9FF] flex gap-5 card-lift">
                <div className="shrink-0 w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center font-mono text-sm font-bold text-white shadow-md shadow-purple-100">{s.n}</div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* V2 Spotlight Section (RAG Candidate Match) */}
      <section id="v2-spotlight" className="py-24 px-5 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-100/30 blur-3xl rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EDE9FF] text-[#6C47FF] uppercase tracking-wider mb-6">
            ✨ Coming Soon in V2
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Intelligent Candidate Matchmaking
          </h2>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            Recruiting isn't just about interviews—it's about finding the right starting point. We're launching an smart matchmaking system that maps your entire candidate pool directly to open roles.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-12">
            <div className="bg-[#F8F7FF] border border-[#EDE9FF] p-6 rounded-2xl">
              <div className="text-2xl mb-3">📂</div>
              <h4 className="font-bold text-gray-900 mb-2">Resume Pool Ingestion</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Upload your resumes and paste the job parameters. Our system parses candidate skills, achievements, and career progressions instantly.
              </p>
            </div>
            <div className="bg-[#F8F7FF] border border-[#EDE9FF] p-6 rounded-2xl">
              <div className="text-2xl mb-3">🔍</div>
              <h4 className="font-bold text-gray-900 mb-2">Evidence-Backed Recommendations</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Using advanced RAG (Retrieval-Augmented Generation), we highlight exactly why a candidate matches the role with linked source citations, guaranteeing 100% transparency.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-[#EDE9FF] p-8 rounded-3xl">
            <h4 className="font-bold text-gray-900 mb-2 text-lg">Want early access to V2 preview features?</h4>
            <p className="text-sm text-gray-500 mb-4">No signups required. Keep using the platform for your current sessions, and your dashboard will automatically unlock the pilot matching module soon.</p>
            <Link href={session ? "/setup" : "/api/auth/signin"} className="inline-flex items-center gap-1 bg-[#6C47FF] hover:bg-[#5A3AE0] text-white px-6 py-3 rounded-xl text-sm font-semibold transition">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-5 border-t border-gray-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="text-white font-bold text-base">CopilotHire</span>
          </div>
          <p className="text-sm">© 2026 CopilotHire. Structuring global talent evaluation. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            {session && <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>}
          </div>
        </div>
      </footer>
    </div>
  );
}