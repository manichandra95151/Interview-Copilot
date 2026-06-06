"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

const SENIORITY = ["Junior", "Mid-Senior", "Executive"];
const SENIORITY_FULL = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Director", "VP / C-level"];

const CATEGORIES = [
  { id: "behavioral",  icon: "🧭", label: "Behavioral",            desc: "Soft skills & cultural fit" },
  { id: "technical",   icon: "⚙️",  label: "Technical Proficiency", desc: "Hard skills & tools knowledge" },
  { id: "experience",  icon: "📋",  label: "Experience deep-dive",  desc: "Verification of past roles" },
  { id: "situational", icon: "🎯",  label: "Situational",           desc: "Problem solving scenarios" },
  { id: "culture",     icon: "🌱",  label: "Culture & Motivation",  desc: "Values, working style & drive" },
  { id: "leadership",  icon: "👥",  label: "Leadership",            desc: "Influence, ownership & collaboration" },
];

type Step = "form" | "generating";

export default function SetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?._token;
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("Mid-level");
  const [seniorityDisplay, setSeniorityDisplay] = useState("Mid-Senior");
  const [jd, setJd] = useState("");
  const [context, setContext] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(["behavioral", "technical"]);
  const [step, setStep] = useState<Step>("form");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const toggleCat = (id: string) => {
    setSelectedCats(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(c => c !== id) : prev
        : [...prev, id]
    );
  };

  const setSeniorityBoth = (label: string) => {
    setSeniorityDisplay(label);
    const map: Record<string,string> = { "Junior":"Junior", "Mid-Senior":"Mid-level", "Executive":"VP / C-level" };
    setSeniority(map[label] || "Mid-level");
  };

  const submit = async () => {
    if (!name.trim()) return setError("Candidate name is required");
    if (!role.trim()) return setError("Role is required");
    if (!jd.trim()) return setError("Job description is required");
    if (!token) return setError("Please sign in first");
    setError(""); setStep("generating");
    try {
      setProgress("Creating session...");
      const form = new FormData();
      form.append("candidateName", name);
      form.append("role", role);
      form.append("seniority", seniority);
      form.append("jdText", jd);
      form.append("extraContext", context);
      if (file) form.append("resume", file);
      const { sessionId } = await api.createSession(form, token);

      setProgress(`Calibrating ${selectedCats.length} competency categories with AI...`);
      await api.generateQuestions(sessionId, selectedCats, token);

      setProgress("Ready! Launching workspace...");
      await new Promise(r => setTimeout(r, 600));
      router.push(`/interview/${sessionId}`);
    } catch (e: any) { setError(e.message); setStep("form"); }
  };

  /* ── GENERATING SCREEN ── */
  if (step === "generating") return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-5">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_8px_32px_rgba(15,23,42,0.08)] anim-scale-in">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <svg className="w-16 h-16 anim-spin" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#E2E8F0" strokeWidth="4"/>
            <path d="M32 4a28 28 0 0128 28" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><path d="M10 3v3m0 8v3M3 10h3m8 0h3" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
        <h2 className="text-base font-bold text-[#0F172A] mb-1">Calibrating Session</h2>
        <p className="text-xs text-[#94A3B8] mb-6">{progress}</p>
        <div className="space-y-3 text-left">
          {[
            { label: "Parsing credentials dossier",   done: true, active: false },
            { label: "Calibrating session parameters", done: !progress.includes("Creating"), active: progress.includes("Creating") },
            { label: "Generating tailored rubrics",    done: progress.includes("Ready"), active: progress.includes("Calibrating") },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              {item.done ? (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
              ) : item.active ? (
                <div className="w-4 h-4 rounded-full border-2 border-[#1D4ED8] border-t-transparent anim-spin shrink-0"/>
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] shrink-0"/>
              )}
              <span className={item.active ? "text-[#0F172A] font-semibold" : "text-[#94A3B8]"}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── MAIN FORM ── */
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E2E8F0] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <span className="font-bold text-[#0F172A] text-[15px]">CopilotHire</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-[#475569]">
            <a href="#" className="hover:text-[#0F172A]">Features</a>
            <a href="#" className="hover:text-[#0F172A]">About</a>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-[#475569] hover:text-[#0F172A] transition">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div className="mb-8 anim-fade-up">
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Configure Interview Workspace</h1>
          <p className="text-[#475569] text-sm mt-1.5">Set up the assessment environment for your candidate in three simple steps.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8 anim-fade-up-1">
          <div className="flex items-center gap-2 bg-[#1D4ED8] text-white text-xs font-bold px-4 py-2 rounded-full">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            Candidate Details
          </div>
          <div className="step-line mx-3"/>
          <div className="flex items-center gap-2 text-xs font-medium text-[#94A3B8] px-3 py-2">
            <span className="w-5 h-5 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[10px] text-[#94A3B8]">2</span>
            Review Workspace
          </div>
          <div className="step-line mx-3"/>
          <div className="flex items-center gap-2 text-xs font-medium text-[#94A3B8] px-3 py-2">
            <span className="w-5 h-5 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[10px] text-[#94A3B8]">3</span>
            Generate Prompt
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 shrink-0"><circle cx="10" cy="10" r="9" stroke="#EF4444" strokeWidth="1.5"/><path d="M10 6v4m0 2.5v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 anim-fade-up-2">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Candidate Info */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#1D4ED8]"><circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <h2 className="font-bold text-[#0F172A] text-base">Candidate Information</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">Full Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Sarah Jenkins"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition bg-white"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">Target Role</label>
                  <input value={role} onChange={e=>setRole(e.target.value)} placeholder="e.g. Senior Software Engineer"
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition bg-white"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-2">Seniority Level</label>
                <div className="flex gap-2">
                  {SENIORITY.map(s => (
                    <button key={s} onClick={()=>setSeniorityBoth(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                        seniorityDisplay===s
                          ? "bg-[#EFF6FF] border-[#1D4ED8] text-[#1D4ED8]"
                          : "bg-white border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#1D4ED8]"><path d="M4 4a2 2 0 012-2h5.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0116 6.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.5"/></svg>
                <h2 className="font-bold text-[#0F172A] text-base">Resume Parsing</h2>
              </div>

              <div
                onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)setFile(f);}}
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onClick={()=>fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragging ? "border-[#1D4ED8] bg-[#EFF6FF]" :
                  file ? "border-green-400 bg-green-50" :
                  "border-[#CBD5E1] hover:border-[#1D4ED8] hover:bg-[#F8FAFC]"
                }`}>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e=>setFile(e.target.files?.[0]||null)}/>
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
                      <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6"><path d="M3 17l3-3m0 0L9 11m-3 3l3-3m5-5l-5 5m5-5l-2 2m2-2V4m0 0H9m6 0v4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <p className="text-sm font-bold text-green-700 truncate">{file.name}</p>
                    <p className="text-xs text-green-500 mt-1">{(file.size/1024).toFixed(0)} KB · Click to change</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-[#EFF6FF] mx-auto mb-3 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-[#1D4ED8]"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <p className="font-semibold text-[#0F172A] text-sm">Click to upload or drag &amp; drop</p>
                    <p className="text-xs text-[#94A3B8] mt-1">PDF, DOCX up to 10MB (parsed automatically by AI)</p>
                  </>
                )}
              </div>

              {file && (
                <button onClick={e=>{e.stopPropagation();setFile(null);}} className="mt-3 text-xs text-[#94A3B8] hover:text-red-500 transition font-medium flex items-center gap-1 mx-auto">
                  ✕ Remove file
                </button>
              )}

              <div className="mt-4 flex items-start gap-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-3.5 py-3">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/><path d="M8 7v4m0-6v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <p className="text-xs text-[#1D4ED8] leading-relaxed">Our AI will extract skills, experience, and educational background to calibrate the interview.</p>
              </div>
            </div>

            {/* Job Description */}
            <div className="card p-6">
              <h2 className="font-bold text-[#0F172A] text-base mb-1">Job Description</h2>
              <p className="text-xs text-[#94A3B8] mb-4">Paste the full job description to generate tailored questions.</p>
              <textarea value={jd} onChange={e=>setJd(e.target.value)} rows={5}
                placeholder="Paste the full job description here — responsibilities, requirements, and background context..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition bg-[#F8FAFC] resize-none"/>
              <p className="text-[10px] text-[#94A3B8] text-right mt-1 font-mono">{jd.length} characters</p>
            </div>

            {/* Extra context */}
            <div className="card p-6">
              <h2 className="font-bold text-[#0F172A] text-base mb-1">Custom Assessment Notes</h2>
              <p className="text-xs text-[#94A3B8] mb-4">Optional extra context for question calibration.</p>
              <textarea value={context} onChange={e=>setContext(e.target.value)} rows={3}
                placeholder="e.g. Needs strong stakeholder management. Startup background is a plus..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition bg-[#F8FAFC] resize-none"/>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Evaluation Focus */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-[#1D4ED8]"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M10 2v2m0 12v2M2 10h2m12 0h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <h2 className="font-bold text-[#0F172A] text-base">Evaluation Focus</h2>
              </div>

              <div className="space-y-2.5">
                {CATEGORIES.map(c => {
                  const sel = selectedCats.includes(c.id);
                  return (
                    <button key={c.id} onClick={()=>toggleCat(c.id)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                        sel ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-base">{c.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${sel ? "text-[#1D4ED8]" : "text-[#0F172A]"}`}>{c.label}</p>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5">{c.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        sel ? "bg-[#1D4ED8] border-[#1D4ED8]" : "border-[#CBD5E1] bg-white"
                      }`}>
                        {sel && <svg viewBox="0 0 12 10" fill="none" className="w-3 h-2.5"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-[#CBD5E1] text-sm font-semibold text-[#475569] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-all">
                + Add Custom Competency
              </button>
            </div>

            {/* Generate CTA */}
            <button onClick={submit} disabled={!name||!role||!jd}
              className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(29,78,216,0.25)]">
              Generate Workspace →
            </button>
            <p className="text-center text-[11px] text-[#94A3B8]">Generates 10 structured rubrics via AI</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-10 px-6 mt-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1D4ED8] flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="1.5"/><path d="M5 8h6M8 5v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <span className="font-bold text-[#0F172A] text-sm">CopilotHire</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">Empowering recruiters with AI-driven insights for precise and fair hiring decisions.</p>
          </div>
          {[
            { label:"Product", links:["Features","Integrations","Pricing"] },
            { label:"Company", links:["About","Careers"] },
            { label:"Legal",   links:["Legal"] },
          ].map(col=>(
            <div key={col.label}>
              <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">{col.label}</p>
              <div className="space-y-2">
                {col.links.map(l=><a key={l} href="#" className="block text-sm text-[#475569] hover:text-[#0F172A] transition">{l}</a>)}
              </div>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#F1F5F9]">
          <p className="text-xs text-[#94A3B8]">© 2024 CopilotHire AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}