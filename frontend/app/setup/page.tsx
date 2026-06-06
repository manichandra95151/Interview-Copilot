"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";

const SENIORITY = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Director", "VP / C-level"];
const CATEGORIES = [
  { id: "behavioral",   icon: "🧭", label: "Behavioral",         desc: "Past experiences & STAR stories" },
  { id: "situational",  icon: "🎯", label: "Situational",         desc: "Hypothetical scenarios & judgment" },
  { id: "experience",   icon: "📋", label: "Experience",          desc: "Domain expertise & past roles" },
  { id: "technical",    icon: "⚙️", label: "Technical / Functional", desc: "Role-specific skills & knowledge" },
  { id: "culture",      icon: "🌱", label: "Culture & Motivation", desc: "Values, working style & drive" },
  { id: "leadership",   icon: "👥", label: "Leadership",          desc: "Influence, ownership & collaboration" },
];

export default function SetupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?._token;
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("Mid-level");
  const [jd, setJd] = useState("");
  const [context, setContext] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(["behavioral", "situational", "experience", "technical"]);
  const [step, setStep] = useState<"form" | "generating">("form");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const toggleCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(c => c !== id) : prev) : [...prev, id]);
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

      setProgress(`Calibrating ${selectedCats.length} category question set with AI...`);
      await api.generateQuestions(sessionId, selectedCats, token);

      setProgress("Ready! Launching workspace...");
      await new Promise(r => setTimeout(r, 600));
      router.push(`/interview/${sessionId}`);
    } catch (e: any) { setError(e.message); setStep("form"); }
  };

  if (step === "generating") return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full bg-white p-8 rounded-3xl border border-[#EDE9FF] shadow-xl shadow-purple-50/50 fade-up">
        {/* Animated Spinners */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#EDE9FF] animate-pulse"></div>
          <svg className="w-12 h-12 animate-spin text-[#6C47FF]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5"></circle>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-1">Calibrating Session</h2>
        <p className="text-gray-400 text-xs">{progress}</p>
        
        {/* Pipeline Checklist */}
        <div className="text-left space-y-3 mb-2 max-w-[240px] mx-auto border-t border-gray-100 pt-5 mt-5">
          <div className="flex items-center gap-3 text-xs">
            <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
            <span className="text-gray-500 font-medium">Parsing credentials dossier</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {progress.includes("Creating") ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#6C47FF] border-t-transparent animate-spin shrink-0"></span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">✓</span>
            )}
            <span className={progress.includes("Creating") ? "text-gray-950 font-bold" : "text-gray-500"}>Calibrating session parameters</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {progress.includes("Calibrating") ? (
              <span className="w-4 h-4 rounded-full border-2 border-[#6C47FF] border-t-transparent animate-spin shrink-0"></span>
            ) : progress.includes("Ready") ? (
              <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0">✓</span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-gray-50 flex items-center justify-center text-[9px] text-gray-300 font-bold shrink-0">•</span>
            )}
            <span className={progress.includes("Calibrating") ? "text-gray-950 font-bold" : "text-gray-400"}>Generating tailored rubrics</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF] pb-16">
      {/* Header */}
      <nav className="bg-white border-b border-[#EDE9FF]/80 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-sm">C</div>
            <span className="font-bold text-gray-900 tracking-tight">CopilotHire</span>
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition flex items-center gap-1">
            <span>←</span> Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 mt-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Configure interview workspace</h1>
          <p className="text-gray-500 text-sm">Provide role context, candidate resume, and configure target evaluation criteria.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-5 py-3.5 rounded-2xl mb-6 flex items-start gap-2 shadow-sm">
            <span className="mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold">Setup Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate info */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="text-xs font-bold text-[#6C47FF] uppercase tracking-wider mb-5">1. Candidate details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full name <span className="text-red-400">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition bg-gray-50 hover:bg-white focus:bg-white"/>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Target Role <span className="text-red-400">*</span></label>
                    <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Product Manager"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition bg-gray-50 hover:bg-white focus:bg-white"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Calibrated Seniority</label>
                    <select value={seniority} onChange={e => setSeniority(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition focus:bg-white">
                      {SENIORITY.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* JD */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="text-xs font-bold text-[#6C47FF] uppercase tracking-wider mb-5">2. Job Parameters <span className="text-red-400">*</span></h2>
              <textarea value={jd} onChange={e => setJd(e.target.value)} rows={7}
                placeholder="Paste the full job description here — responsibilities, requirements, and background context..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition resize-none focus:bg-white"/>
              <p className="text-[10px] text-gray-400 text-right mt-1 font-mono">{jd.length} characters</p>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="text-xs font-bold text-[#6C47FF] uppercase tracking-wider mb-5">3. Custom Assessment Notes</h2>
              <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
                placeholder="e.g. Needs strong stakeholder management. Startup background is a plus. Test adaptability to changing environments."
                className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition resize-none focus:bg-white"/>
            </div>
          </div>

          {/* Right sidebar options */}
          <div className="space-y-6">
            {/* Resume Upload */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="text-xs font-bold text-[#6C47FF] uppercase tracking-wider mb-1">Resume</h2>
              <p className="text-[10px] text-gray-400 mb-4">Optional. Calibrates customized interview questions.</p>
              <div onDrop={e => { e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f) setFile(f); }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragging ? "border-[#6C47FF] bg-[#EDE9FF]/30" :
                  file ? "border-green-400 bg-green-50/30" :
                  "border-[#EDE9FF] hover:border-[#6C47FF] hover:bg-[#F8F7FF]"
                }`}>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0]||null)}/>
                {file ? (
                  <>
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-xs font-bold text-green-700 truncate">{file.name}</p>
                    <p className="text-[10px] text-green-500 mt-0.5">{(file.size/1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl mb-1">📎</div>
                    <p className="text-xs font-semibold text-gray-500">Click to browse or drop resume</p>
                    <p className="text-[10px] text-gray-400 mt-1">PDF, DOCX, TXT up to 10MB</p>
                  </>
                )}
              </div>
              {file && (
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="mt-3 text-xs text-gray-400 hover:text-red-500 transition font-medium flex items-center gap-1 mx-auto">
                  <span>✕</span> Remove Resume
                </button>
              )}
            </div>

            {/* Target Competencies */}
            <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6 shadow-sm">
              <h2 className="text-xs font-bold text-[#6C47FF] uppercase tracking-wider mb-1">Competencies</h2>
              <p className="text-[10px] text-gray-400 mb-4">Select categories to calibrate. Min 1 required.</p>
              <div className="space-y-2.5">
                {CATEGORIES.map(c => {
                  const selected = selectedCats.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => toggleCat(c.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        selected ? "border-[#6C47FF] bg-[#F8F7FF]" : "border-gray-100 hover:border-[#EDE9FF] bg-white"
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{c.icon}</span>
                        <div>
                          <p className={`text-xs font-bold ${selected ? "text-[#6C47FF]" : "text-gray-700"}`}>{c.label}</p>
                          <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{c.desc}</p>
                        </div>
                      </div>
                      <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition ${
                        selected ? "bg-[#6C47FF] border-[#6C47FF]" : "border-gray-300"
                      }`}>
                        {selected && (
                          <svg viewBox="0 0 12 10" className="w-2.5 h-2"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"/></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <button onClick={submit} disabled={!name||!role||!jd}
              className="w-full bg-[#6C47FF] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#5A3AE0] transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200/50">
              Generate workspace →
            </button>
            <p className="text-center text-[10px] text-gray-400">Generates 10 structured rubrics via AI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}