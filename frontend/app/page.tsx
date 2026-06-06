import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

const features = [
  { icon: "⚡", title: "AI Question Generation", desc: "Upload resume + JD, get 10 precision-crafted questions in seconds. Behavioral, situational, technical — calibrated to seniority." },
  { icon: "🎙️", title: "Live Voice Evaluation", desc: "Record answers during the interview. AI transcribes, scores 1–10, and suggests follow-ups in under 2 seconds." },
  { icon: "📊", title: "Visual Score Reports", desc: "Competency radar charts, category breakdowns, red flags, and a hire/no-hire recommendation backed by evidence." },
  { icon: "🔗", title: "Shareable Public Reports", desc: "One click to generate a public link. Share with stakeholders, panel members, or HR — no login required to view." },
  { icon: "🎯", title: "Category Filters", desc: "Choose which question types matter most: behavioral, situational, experience, technical, culture fit, or leadership." },
  { icon: "🧠", title: "Honest Skipped Analysis", desc: "Skipped questions and non-answers are tracked and explained in the report — nothing slips through unnoticed." },
];

const steps = [
  { n: "01", title: "Upload & configure", desc: "Drop the candidate's resume, paste the JD, pick question categories, and add any context." },
  { n: "02", title: "Generate questions", desc: "AI produces 10 sharp, rubric-backed questions tailored to the exact role and candidate background." },
  { n: "03", title: "Interview live", desc: "Questions appear one at a time. Record answers, get AI scores and follow-up suggestions instantly." },
  { n: "04", title: "Get the report", desc: "Structured report with charts, competency scores, strengths, gaps, red flags and a clear recommendation." },
];

const testimonials = [
  { q: "The follow-up question suggestions are genuinely impressive — it catches when a candidate is being vague in a way I'd have missed.", name: "Meera S.", role: "VP Engineering, Series B" },
  { q: "I ran 12 interviews last month with CopilotHire. The reports alone saved me 3+ hours of post-interview write-ups.", name: "Arjun K.", role: "Product Director, Fintech" },
  { q: "The shareable report feature is the killer feature. I send it to the panel and everyone's aligned before the debrief.", name: "Pooja R.", role: "Head of People, SaaS startup" },
];

export default async function HomePage() {
  const isAuthEnabled = process.env.isAuth === 'true' || process.env.IS_AUTH === 'true';
  const session = isAuthEnabled
    ? await getServerSession(authOptions)
    : {
        user: {
          name: "Mock User",
          email: "mock-user@example.com",
          image: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
        }
      };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-purple-50">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-200">C</div>
            <span className="font-semibold text-gray-900 tracking-tight">CopilotHire</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <img src={session.user?.image || ''} className="w-7 h-7 rounded-full" alt="" />
                  <span className="text-sm text-gray-600">{session.user?.name?.split(' ')[0]}</span>
                </div>
                <Link href="/dashboard" className="bg-[#6C47FF] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#5A3AE0] transition font-medium shadow-lg shadow-purple-200">
                  Dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link href="/api/auth/signin" className="text-sm text-gray-500 hover:text-gray-900 transition hidden sm:block">Sign in</Link>
                <Link href="/api/auth/signin" className="bg-[#6C47FF] text-white text-sm px-4 py-2 rounded-xl hover:bg-[#5A3AE0] transition font-medium shadow-lg shadow-purple-200">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg pt-32 pb-24 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#EDE9FF] text-[#6C47FF] text-xs font-semibold px-4 py-1.5 rounded-full mb-7 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 bg-[#6C47FF] rounded-full animate-pulse"></span>
            Free to use · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
            Interview smarter.<br />
            <span className="gradient-text">Hire with confidence.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI copilot for non-technical hiring managers. Generate tailored questions, record and evaluate answers live, and get a full structured report — in one seamless session.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={session ? "/setup" : "/api/auth/signin"}
              className="inline-flex items-center justify-center gap-2 bg-[#6C47FF] text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-[#5A3AE0] transition shadow-xl shadow-purple-200">
              Start your first interview →
            </Link>
            {!session && (
              <Link href="/api/auth/signin"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl text-base font-semibold border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition">
                Sign in with Google
              </Link>
            )}
          </div>
          <p className="mt-5 text-sm text-gray-400">Trusted by 500+ hiring managers</p>
        </div>

        {/* App preview mockup */}
        <div className="max-w-5xl mx-auto mt-16 float">
          <div className="bg-white rounded-3xl shadow-2xl shadow-purple-100 border border-purple-50 overflow-hidden">
            <div className="bg-gray-50/80 border-b border-gray-100 px-5 py-3 flex items-center gap-2">
              <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-yellow-400"/><div className="w-3 h-3 rounded-full bg-green-400"/></div>
              <span className="mx-auto text-xs text-gray-400 font-mono">CopilotHire — Live Interview</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Left sidebar */}
              <div className="md:col-span-1 space-y-1.5">
                {[{n:1,s:'done',score:9},{n:2,s:'done',score:7},{n:3,s:'active'},{n:4,s:'pending'},{n:5,s:'pending'}].map(q => (
                  <div key={q.n} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${q.s==='active' ? 'bg-[#EDE9FF]' : 'hover:bg-gray-50'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      q.s==='done' && (q.score||0)>=8 ? 'bg-green-100 text-green-700' :
                      q.s==='done' ? 'bg-amber-100 text-amber-700' :
                      q.s==='active' ? 'bg-[#6C47FF] text-white' : 'bg-gray-100 text-gray-400'
                    }`}>{q.s==='done'?(q.score||'✓'):q.n}</div>
                    <div className={`h-1.5 flex-1 rounded-full ${q.s==='done'? (q.score||0)>=8?'bg-green-200':'bg-amber-200' : q.s==='active'?'bg-[#EDE9FF]':'bg-gray-100'}`}/>
                  </div>
                ))}
              </div>
              {/* Question + recording */}
              <div className="md:col-span-2 space-y-3">
                <div className="bg-[#F8F7FF] rounded-2xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-[#EDE9FF] text-[#6C47FF] font-semibold px-2 py-0.5 rounded-full">Q3 / 10</span>
                    <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">Behavioral</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed">Tell me about a time you had to manage a project through unexpected scope changes. How did you keep stakeholders aligned?</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <div className="relative mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full rec-pulse"/>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed italic">"We had a major infrastructure change mid-project. I immediately called a stakeholder sync, re-baselined the scope in writing, and set up weekly check-ins..."</p>
                </div>
              </div>
              {/* Eval panel */}
              <div className="md:col-span-2 space-y-3">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Score</span>
                    <span className="text-lg font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-lg">8/10</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full fill-bar" style={{width:'80%'}}/>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-green-50 rounded-xl px-3 py-2"><p className="text-xs font-semibold text-green-700">✓ Strength</p><p className="text-xs text-green-600 mt-0.5">Proactive stakeholder communication with structured check-ins.</p></div>
                    <div className="bg-[#FEF9C3] rounded-xl px-3 py-2"><p className="text-xs font-semibold text-amber-700">💡 Follow-up</p><p className="text-xs text-amber-600 mt-0.5 italic">"What metric told you the re-baselining was working?"</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Built for real hiring managers</h2>
            <p className="text-lg text-gray-500">Not HR software. A copilot that makes you sharper in every interview.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-[#F8F7FF] rounded-2xl p-6 border border-[#EDE9FF] card-lift group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-5 bg-[#F8F7FF]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">From setup to report in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-7 border border-[#EDE9FF] flex gap-5 card-lift">
                <div className="shrink-0 w-12 h-12 rounded-2xl brand-gradient flex items-center justify-center font-mono text-sm font-bold text-white shadow-lg shadow-purple-200">{s.n}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href={session ? "/setup" : "/api/auth/signin"} className="inline-flex items-center gap-2 bg-[#6C47FF] text-white px-8 py-4 rounded-2xl font-semibold hover:bg-[#5A3AE0] transition shadow-xl shadow-purple-200">
              Try it now — free →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">What managers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#F8F7FF] rounded-2xl p-6 border border-[#EDE9FF] card-lift">
                <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_,i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">&ldquo;{t.q}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 brand-gradient">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">Ready to hire better?</h2>
          <p className="text-purple-200 text-lg mb-8">Join 500+ managers running structured, AI-powered interviews. Free to start.</p>
          <Link href={session ? "/setup" : "/api/auth/signin"} className="inline-block bg-white text-[#6C47FF] px-10 py-4 rounded-2xl font-bold hover:bg-purple-50 transition shadow-xl">
            Start free — no credit card →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-500 py-12 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="text-white font-semibold">CopilotHire</span>
          </div>
          <p className="text-sm">© 2026 CopilotHire. Built for managers who care about hiring right.</p>
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