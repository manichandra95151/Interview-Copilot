import Link from "next/link";

const features = [
  { icon: "📄", title: "Resume & JD Analysis", desc: "Upload resume and paste JD. AI extracts key skills, experience, and requirements instantly." },
  { icon: "🎯", title: "Tailored Question Gen", desc: "10 role-specific questions — behavioral, situational, and technical — with scoring rubrics." },
  { icon: "🎙️", title: "Live Voice Recording", desc: "Record candidate answers directly in the browser. Transcribed in real time, no extra tools." },
  { icon: "⚡", title: "Instant AI Evaluation", desc: "Groq-powered evaluation in under 1 second. Score, strength, gap, and follow-up suggestions." },
  { icon: "🔍", title: "Smart Follow-Ups", desc: "AI detects vague answers and suggests sharp probing questions — only visible to you." },
  { icon: "📊", title: "Structured Report", desc: "Full post-interview report: verdict, competency scores, red flags, and next steps." },
];

const steps = [
  { num: "01", title: "Upload Resume & JD", desc: "Drop the candidate's resume and paste the job description. Add any extra context about the role." },
  { num: "02", title: "Generate Questions", desc: "AI generates 10 tailored questions with rubrics. Edit, reorder, or add your own." },
  { num: "03", title: "Run Live Interview", desc: "Press record after each question. Candidate speaks, AI transcribes and evaluates in real time." },
  { num: "04", title: "Get Your Report", desc: "Full structured report with scores, strengths, gaps, red flags, and hire recommendation." },
];

const testimonials = [
  { quote: "I used to spend 2 hours prepping interview questions. Now it takes 5 minutes and the questions are better than anything I'd write myself.", name: "Priya M.", role: "Product Director, SaaS startup" },
  { quote: "The real-time follow-up suggestions are game-changing. I caught things I would have completely missed before.", name: "Rahul T.", role: "Engineering Manager, Fintech" },
  { quote: "Our interview process went from inconsistent to gold-standard in one week. Every manager uses it now.", name: "Ananya K.", role: "Head of People, Series B startup" },
];

const pricing = [
  { name: "Free", price: "$0", period: "forever", features: ["5 interviews/month", "AI question generation", "Live evaluation", "Basic report"], cta: "Get Started", highlight: false },
  { name: "Pro", price: "$29", period: "/month", features: ["Unlimited interviews", "Everything in Free", "PDF export", "Question library", "Role templates", "Priority support"], cta: "Start Free Trial", highlight: true },
  { name: "Team", price: "$99", period: "/month", features: ["Everything in Pro", "Up to 10 managers", "Team analytics", "ATS integration", "Custom rubrics", "Dedicated support"], cta: "Contact Sales", highlight: false },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
            <span className="font-semibold text-gray-900 text-lg">InterviewAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block transition-colors">
              Sign in
            </Link>
            <Link href="/setup" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg pt-20 pb-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm px-4 py-1.5 rounded-full mb-6 font-medium">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Free to use · No credit card required
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Interview smarter,<br />
            <span className="gradient-text">hire better</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered interview copilot for non-technical hiring managers. Upload a resume, get tailored questions, record answers, and receive a structured evaluation report — all in one session.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/setup" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300">
              Start your first interview →
            </Link>
            <Link href="/dashboard" className="bg-white text-gray-700 px-8 py-3.5 rounded-xl text-base font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
              View dashboard
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">Trusted by 500+ hiring managers · 10,000+ interviews conducted</p>
        </div>

        {/* Hero visual */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="ml-3 text-xs text-gray-400 font-mono">InterviewAI — Live Session</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">Q3</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tell me about a time you had to prioritise competing deadlines. How did you handle it?</p>
                    <span className="text-xs text-indigo-600 font-medium">Behavioral · 2–3 min</span>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="relative w-3 h-3 shrink-0">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-60"></div>
                  </div>
                  <p className="text-sm text-gray-600 italic">"In my previous role at TechCorp, I managed three simultaneous launches. I used an impact-effort matrix to rank tasks and communicated trade-offs clearly with stakeholders..."</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-green-700">AI Score</span>
                    <span className="text-lg font-bold text-green-700">8/10</span>
                  </div>
                  <p className="text-xs text-green-600">Strong framework usage. Clear stakeholder communication.</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">💡 Follow-up</p>
                  <p className="text-xs text-amber-600">"What metric told you the prioritisation was working?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to interview well</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Built for managers who want structure without complexity. No training required.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 hover:bg-indigo-50 transition-colors group card-hover border border-transparent hover:border-indigo-100">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">From resume to report in 4 steps</h2>
            <p className="text-lg text-gray-500">A complete interview, start to finish, in under an hour.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="bg-white rounded-2xl p-8 border border-gray-100 flex gap-5 card-hover">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono text-sm font-bold">{s.num}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/setup" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Try it now — it&apos;s free →
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by hiring managers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 card-hover">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500">Start free. Upgrade when you need more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((p) => (
              <div key={p.name} className={`rounded-2xl p-8 border ${p.highlight ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-gray-100'} card-hover`}>
                {p.highlight && <div className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-4">Most Popular</div>}
                <h3 className={`text-xl font-bold mb-1 ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.price}</span>
                  <span className={`text-sm ${p.highlight ? 'text-indigo-200' : 'text-gray-400'}`}>{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className={p.highlight ? 'text-indigo-200' : 'text-indigo-500'}>✓</span>
                      <span className={p.highlight ? 'text-indigo-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/setup" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${p.highlight ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-4 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to transform your interviews?</h2>
          <p className="text-indigo-200 text-lg mb-8">Join 500+ managers running structured, AI-powered interviews. Free to start.</p>
          <Link href="/setup" className="inline-block bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-base hover:bg-indigo-50 transition-colors shadow-lg">
            Start your first interview — free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
            <span className="text-white font-semibold">InterviewAI</span>
          </div>
          <p className="text-sm">© 2026 InterviewAI. Built for managers who care about hiring right.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}