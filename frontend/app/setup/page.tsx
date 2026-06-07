"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

const SENIORITY = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Director", "VP / C-level"];
const SENIORITY_QUICK = ["Junior", "Mid-Senior", "Executive"];
const SENIORITY_QUICK_MAP: Record<string, string> = { "Junior": "Junior", "Mid-Senior": "Senior", "Executive": "VP / C-level" };

const CATEGORIES = [
  { id: "behavioral",  icon: "🧭", label: "Behavioral",              desc: "Soft skills & cultural fit" },
  { id: "technical",   icon: "⚙️",  label: "Technical Proficiency",   desc: "Hard skills & tools knowledge" },
  { id: "experience",  icon: "📋",  label: "Experience deep-dive",    desc: "Verification of past roles" },
  { id: "situational", icon: "🎯",  label: "Situational",             desc: "Problem solving scenarios" },
  { id: "culture",     icon: "🌱",  label: "Culture & Motivation",    desc: "Values, working style & drive" },
  { id: "leadership",  icon: "👥",  label: "Leadership",              desc: "Influence, ownership & collaboration" },
];

/* ─── Loader ─── */
function Loader({ title, subtitle, steps }: { title: string; subtitle: string; steps: { label: string; state: "done"|"active"|"pending" }[] }) {
  return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl border border-[#EDE9FF] p-8 max-w-sm w-full text-center shadow-xl shadow-purple-50/60 scale-in">
        {/* Animated ring */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <svg className="w-16 h-16" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="26" stroke="#EDE9FF" strokeWidth="4"/>
            <circle cx="32" cy="32" r="26" stroke="url(#lg)" strokeWidth="4"
              strokeDasharray="163" strokeDashoffset="40"
              strokeLinecap="round" transform="rotate(-90 32 32)" className="spin"/>
            <defs>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6C47FF"/>
                <stop offset="100%" stopColor="#EC4899"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
          </div>
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-gray-400 text-xs mb-6">{subtitle}</p>
        <div className="text-left space-y-2.5 border-t border-gray-100 pt-5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              {s.state === "done" ? (
                <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">✓</span>
              ) : s.state === "active" ? (
                <span className="w-4 h-4 rounded-full border-2 border-[#6C47FF] border-t-transparent spin shrink-0"/>
              ) : (
                <span className="w-4 h-4 rounded-full bg-gray-100 shrink-0"/>
              )}
              <span className={s.state === "active" ? "text-gray-900 font-bold" : s.state === "done" ? "text-gray-500" : "text-gray-300"}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?._token;
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("Mid-level");
  const [seniorityQuick, setSeniorityQuick] = useState("Mid-Senior");
  const [jd, setJd] = useState("");
  const [context, setContext] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(["behavioral", "technical"]);
  const [customComp, setCustomComp] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [error, setError] = useState("");

  const toggleCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(c => c !== id) : prev) : [...prev, id]);
  };

  const addCustomComp = () => {
    const t = customComp.trim();
    if (!t || selectedCats.includes(t)) return;
    setSelectedCats(prev => [...prev, t]);
    setCustomComp("");
    setShowCustomInput(false);
  };

  const setQuickSeniority = (q: string) => {
    setSeniorityQuick(q);
    setSeniority(SENIORITY_QUICK_MAP[q] || "Mid-level");
  };

  const submit = async () => {
    if (!name.trim()) return setError("Candidate name is required");
    if (!role.trim()) return setError("Role is required");
    if (!jd.trim()) return setError("Job description is required");
    if (!token) return setError("Please sign in first");
    setError(""); setGenerating(true);
    try {
      setGenProgress("creating");
      const form = new FormData();
      form.append("candidateName", name); form.append("role", role);
      form.append("seniority", seniority); form.append("jdText", jd);
      form.append("extraContext", context);
      if (file) form.append("resume", file);
      const { sessionId } = await api.createSession(form, token);
      setGenProgress("calibrating");
      await api.generateQuestions(sessionId, selectedCats, token);
      setGenProgress("ready");
      await new Promise(r => setTimeout(r, 600));
      router.push(`/interview/${sessionId}`);
    } catch (e: any) { setError(e.message); setGenerating(false); }
  };

  if (generating) return (
    <Loader
      title="Calibrating Session"
      subtitle={genProgress === "creating" ? "Creating session..." : genProgress === "calibrating" ? `Calibrating ${selectedCats.length} categories with AI...` : "Ready! Launching..."}
      steps={[
        { label: "Parsing credentials dossier",    state: "done" },
        { label: "Calibrating session parameters", state: genProgress === "creating" ? "active" : "done" },
        { label: "Generating tailored rubrics",    state: genProgress === "calibrating" ? "active" : genProgress === "ready" ? "done" : "pending" },
      ]}
    />
  );

  const canSubmit = name.trim() && role.trim() && jd.trim();

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#EDE9FF]/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-black text-sm shadow-sm">C</div>
            <span className="font-bold text-gray-900 tracking-tight">CopilotHire</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-gray-900 transition">Features</a>
            <a href="#" className="hover:text-gray-900 transition">About</a>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition flex items-center gap-1">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-8 pb-16">
        {/* Heading */}
        <div className="mb-7 fade-up">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Configure Interview Workspace</h1>
          <p className="text-gray-500 text-sm mt-1.5">Set up the assessment environment for your candidate in three simple steps.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8 fade-up-1 overflow-x-auto pb-1">
          {[
            { n:1, label:"Candidate Details",  active:true },
            { n:2, label:"Review Workspace",   active:false },
            { n:3, label:"Generate Prompt",    active:false },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center shrink-0">
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-bold transition-all ${
                s.active ? "bg-[#6C47FF] text-white shadow-md shadow-purple-200/60" : "text-gray-400"
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  s.active ? "bg-white/25" : "border border-gray-200 bg-white text-gray-400"
                }`}>{s.n}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="h-[2px] w-6 sm:w-10 bg-gradient-to-r from-[#6C47FF]/30 to-gray-200 mx-1"/>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl mb-6 flex items-center gap-2 fade-in shadow-sm">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0"><circle cx="10" cy="10" r="9" stroke="#ef4444" strokeWidth="1.5"/><path d="M10 6v4m0 2.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 fade-up-2">

          {/* ── LEFT ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Candidate Info */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[#EDE9FF] flex items-center justify-center text-[#6C47FF] text-sm">👤</div>
                <h2 className="font-bold text-gray-900 text-base">Candidate Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Jenkins"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition bg-gray-50 hover:bg-white focus:bg-white"/>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Role <span className="text-red-400">*</span></label>
                  <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Software Engineer"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition bg-gray-50 hover:bg-white focus:bg-white"/>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Seniority Level</label>
                <div className="flex gap-2 mb-2">
                  {SENIORITY_QUICK.map(q => (
                    <button key={q} onClick={() => setQuickSeniority(q)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        seniorityQuick === q
                          ? "bg-[#EDE9FF] border-[#6C47FF] text-[#6C47FF]"
                          : "bg-white border-gray-200 text-gray-500 hover:border-[#6C47FF]/50"
                      }`}>{q}</button>
                  ))}
                </div>
                <select value={seniority} onChange={e => { setSeniority(e.target.value); setSeniorityQuick(""); }}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-500 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition">
                  {SENIORITY.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[#EDE9FF] flex items-center justify-center text-[#6C47FF] text-sm">📄</div>
                <h2 className="font-bold text-gray-900 text-base">Resume Parsing</h2>
              </div>
              <div
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? "border-[#6C47FF] bg-[#EDE9FF]/30" :
                  file ? "border-green-400 bg-green-50/30" :
                  "border-[#EDE9FF] hover:border-[#6C47FF] hover:bg-[#F8F7FF]"
                }`}>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)}/>
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center text-xl">✅</div>
                    <p className="text-sm font-bold text-green-700 truncate">{file.name}</p>
                    <p className="text-[11px] text-green-500 mt-1">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-[#EDE9FF]/60 mx-auto mb-3 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-[#6C47FF]"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p className="font-semibold text-gray-700 text-sm">Click to upload or drag &amp; drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 10MB (parsed automatically by AI)</p>
                  </>
                )}
              </div>
              {file && (
                <button onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="mt-3 text-xs text-gray-400 hover:text-red-500 transition font-medium flex items-center gap-1 mx-auto">
                  ✕ Remove file
                </button>
              )}
              <div className="mt-3.5 flex items-start gap-2 bg-[#F8F7FF] border border-[#EDE9FF] rounded-xl px-3 py-2.5">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-[#6C47FF] shrink-0 mt-0.5"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/><path d="M8 7v4m0-6v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <p className="text-[11px] text-gray-500 leading-relaxed">Our AI will extract skills, experience, and educational background to calibrate the interview.</p>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-base mb-1">Job Description <span className="text-red-400 text-sm">*</span></h2>
              <p className="text-[11px] text-gray-400 mb-4">Paste the full job description to generate tailored rubric-aligned questions.</p>
              <textarea value={jd} onChange={e => setJd(e.target.value)} rows={6}
                placeholder="Paste the full job description here — responsibilities, requirements, and background context..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition resize-none focus:bg-white"/>
              <p className="text-[10px] text-gray-400 text-right mt-1 font-mono">{jd.length} chars</p>
            </div>

            {/* Custom Notes */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 text-base mb-1">Custom Assessment Notes</h2>
              <p className="text-[11px] text-gray-400 mb-4">Optional — extra context to refine question calibration.</p>
              <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
                placeholder="e.g. Needs strong stakeholder management. Startup background is a plus..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition resize-none focus:bg-white"/>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Evaluation Focus */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-lg bg-[#EDE9FF] flex items-center justify-center text-[#6C47FF] text-sm">🎯</div>
                <h2 className="font-bold text-gray-900 text-base">Evaluation Focus</h2>
              </div>
              <div className="space-y-2">
                {CATEGORIES.map(c => {
                  const sel = selectedCats.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => toggleCat(c.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        sel ? "border-[#6C47FF] bg-[#F8F7FF]" : "border-gray-100 bg-white hover:border-[#EDE9FF]"
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-base leading-none">{c.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${sel ? "text-[#6C47FF]" : "text-gray-700"}`}>{c.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{c.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        sel ? "bg-[#6C47FF] border-[#6C47FF]" : "border-gray-300 bg-white"
                      }`}>
                        {sel && <svg viewBox="0 0 12 10" fill="none" className="w-3 h-2.5"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                      </div>
                    </button>
                  );
                })}

                {/* Custom competencies added */}
                {selectedCats.filter(c => !CATEGORIES.find(cat => cat.id === c)).map(custom => (
                  <div key={custom} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#6C47FF] bg-[#F8F7FF]">
                    <div className="flex items-center gap-3">
                      <span className="text-base">✨</span>
                      <span className="text-sm font-semibold text-[#6C47FF]">{custom}</span>
                    </div>
                    <button onClick={() => setSelectedCats(prev => prev.filter(c => c !== custom))}
                      className="text-gray-300 hover:text-red-400 transition text-sm font-bold">✕</button>
                  </div>
                ))}
              </div>

              {/* Add custom competency */}
              {showCustomInput ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={customComp}
                    onChange={e => setCustomComp(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCustomComp(); if (e.key === "Escape") setShowCustomInput(false); }}
                    placeholder="e.g. Negotiation, Data literacy..."
                    autoFocus
                    className="flex-1 border border-[#6C47FF] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] bg-[#F8F7FF]"
                  />
                  <button onClick={addCustomComp}
                    className="bg-[#6C47FF] text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-[#5A3AE0] transition">
                    Add
                  </button>
                  <button onClick={() => setShowCustomInput(false)}
                    className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-[#EDE9FF] text-sm font-semibold text-gray-400 hover:border-[#6C47FF] hover:text-[#6C47FF] transition-all flex items-center justify-center gap-2">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  Add Custom Competency
                </button>
              )}
            </div>

            {/* Generate CTA */}
            <button onClick={submit} disabled={!canSubmit}
              className="w-full bg-[#6C47FF] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#5A3AE0] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-purple-200/60">
              Generate Workspace →
            </button>
            <p className="text-center text-[10px] text-gray-400">Generates {Math.max(10, selectedCats.length * 2)} structured rubrics via AI.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EDE9FF]/80 py-10 px-5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg brand-gradient flex items-center justify-center text-white text-xs font-black">C</div>
              <span className="font-bold text-gray-900 text-sm">CopilotHire</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Empowering recruiters with AI-driven insights for precise and fair hiring decisions.</p>
          </div>
          {[{ label:"Product", links:["Features","Integrations","Pricing"] }, { label:"Company", links:["About","Careers"] }, { label:"Legal", links:["Privacy","Terms"] }].map(col => (
            <div key={col.label}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{col.label}</p>
              <div className="space-y-2">{col.links.map(l => <a key={l} href="#" className="block text-sm text-gray-500 hover:text-gray-900 transition">{l}</a>)}</div>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-5 border-t border-gray-100">
          <p className="text-xs text-gray-400">© 2024 CopilotHire AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}