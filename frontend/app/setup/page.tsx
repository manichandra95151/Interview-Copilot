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

      setProgress(`Generating ${selectedCats.length} category question set with AI...`);
      await api.generateQuestions(sessionId, selectedCats, token);

      setProgress("Ready! Launching interview...");
      await new Promise(r => setTimeout(r, 600));
      router.push(`/interview/${sessionId}`);
    } catch (e: any) { setError(e.message); setStep("form"); }
  };

  if (step === "generating") return (
    <div className="min-h-screen bg-[#F8F7FF] flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 brand-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl shadow-purple-200 animate-pulse">🤖</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Setting up your interview</h2>
        <p className="text-gray-400 text-sm mb-8">{progress}</p>
        <div className="w-full bg-[#EDE9FF] rounded-full h-1.5 overflow-hidden">
          <div className="bg-[#6C47FF] h-1.5 rounded-full transition-all duration-700"
            style={{ width: progress.includes("question") ? "60%" : progress.includes("Ready") ? "100%" : "25%" }}/>
        </div>
        <p className="text-xs text-gray-400 mt-4">Usually takes 10–20 seconds</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      <nav className="bg-white border-b border-purple-50">
        <div className="max-w-3xl mx-auto px-5 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl brand-gradient flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-semibold text-gray-900">CopilotHire</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Set up interview</h1>
          <p className="text-gray-400 text-sm">Takes 2 minutes. AI handles question generation.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
            <span>⚠️</span>{error}
          </div>
        )}

        <div className="space-y-5">
          {/* Candidate */}
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Candidate details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name <span className="text-red-400">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition bg-gray-50 hover:bg-white"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-400">*</span></label>
                  <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Product Manager"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition bg-gray-50 hover:bg-white"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Seniority level</label>
                  <select value={seniority} onChange={e => setSeniority(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] transition">
                    {SENIORITY.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resume */}
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Resume</h2>
            <p className="text-xs text-gray-400 mb-4">Optional — improves question personalisation</p>
            <div onDrop={e => { e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f) setFile(f); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragging ? "border-[#6C47FF] bg-[#EDE9FF]" :
                file ? "border-green-400 bg-green-50" :
                "border-[#EDE9FF] hover:border-[#6C47FF] hover:bg-[#F8F7FF]"
              }`}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0]||null)}/>
              {file ? (
                <><div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-semibold text-green-700">{file.name}</p>
                <p className="text-xs text-green-500 mt-1">{(file.size/1024).toFixed(0)} KB</p></>
              ) : (
                <><div className="text-3xl mb-2">📎</div>
                <p className="text-sm font-medium text-gray-500">Drop resume here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT · Max 10 MB</p></>
              )}
            </div>
            {file && <button onClick={() => setFile(null)} className="mt-2 text-xs text-gray-400 hover:text-red-400 transition">Remove</button>}
          </div>

          {/* JD */}
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Job description <span className="text-red-400">*</span></h2>
            <p className="text-xs text-gray-400 mb-4">The more detail, the better the questions</p>
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={8}
              placeholder="Paste the full job description here — responsibilities, requirements, skills, team context..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition resize-none"/>
            <p className="text-xs text-gray-400 mt-2">{jd.length} chars</p>
          </div>

          {/* Question categories */}
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Question categories</h2>
            <p className="text-xs text-gray-400 mb-4">Select which types of questions to generate. At least 1 required.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CATEGORIES.map(c => {
                const selected = selectedCats.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCat(c.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selected ? "border-[#6C47FF] bg-[#F8F7FF]" : "border-gray-100 hover:border-[#EDE9FF] bg-white"
                    }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{c.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold mb-0.5 ${selected ? "text-[#6C47FF]" : "text-gray-700"}`}>{c.label}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{c.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        selected ? "bg-[#6C47FF] border-[#6C47FF]" : "border-gray-300"
                      }`}>
                        {selected && <svg viewBox="0 0 12 10" className="w-3 h-2.5"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">{selectedCats.length} categories selected → AI will generate 10 questions spread across them</p>
          </div>

          {/* Extra context */}
          <div className="bg-white rounded-2xl border border-[#EDE9FF] p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Interviewer notes</h2>
            <p className="text-xs text-gray-400 mb-4">Deal-breakers, specific concerns, team context — anything to focus the AI on</p>
            <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
              placeholder="e.g. Must have B2B SaaS experience. Team is fully remote. Looking for strong stakeholder management. Previous startup background is a plus."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#6C47FF] focus:border-transparent transition resize-none"/>
          </div>

          <button onClick={submit} disabled={!name||!role||!jd}
            className="w-full bg-[#6C47FF] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#5A3AE0] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-purple-200">
            Generate questions & start interview →
          </button>
          <p className="text-center text-xs text-gray-400">AI generates 10 tailored questions in ~15 seconds</p>
        </div>
      </div>
    </div>
  );
}