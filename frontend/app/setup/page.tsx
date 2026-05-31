"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const SENIORITY_OPTIONS = ["Junior", "Mid-level", "Senior", "Lead", "Principal", "Director", "VP"];

export default function SetupPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [candidateName, setCandidateName] = useState("");
  const [role, setRole] = useState("");
  const [seniority, setSeniority] = useState("Mid-level");
  const [jdText, setJdText] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<"form" | "generating">("form");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!candidateName.trim()) return setError("Candidate name is required");
    if (!role.trim()) return setError("Role is required");
    if (!jdText.trim()) return setError("Job description is required");
    setError("");
    setStep("generating");

    try {
      setProgress("Creating session...");
      const form = new FormData();
      form.append("candidateName", candidateName);
      form.append("role", role);
      form.append("seniority", seniority);
      form.append("jdText", jdText);
      form.append("extraContext", extraContext);
      if (file) form.append("resume", file);

      const { sessionId } = await api.createSession(form);

      setProgress("Generating tailored questions with AI...");
      await api.generateQuestions(sessionId);

      setProgress("Ready! Starting interview...");
      await new Promise(r => setTimeout(r, 800));
      router.push(`/interview/${sessionId}`);
    } catch (e: any) {
      setError(e.message);
      setStep("form");
    }
  };

  if (step === "generating") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl animate-pulse">🤖</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Setting up your interview</h2>
          <p className="text-gray-500 text-sm mb-6">{progress}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: progress.includes("question") ? "60%" : progress.includes("Ready") ? "100%" : "30%" }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
            <span className="font-semibold text-gray-900">InterviewAI</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up your interview</h1>
          <p className="text-gray-500 text-sm">Takes 2 minutes. AI handles the rest.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Candidate info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Candidate</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role being interviewed for <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Seniority level</label>
                  <select
                    value={seniority}
                    onChange={e => setSeniority(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                  >
                    {SENIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resume upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm uppercase tracking-wider">Resume</h2>
            <p className="text-xs text-gray-400 mb-4">Optional but improves question quality</p>
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? "border-indigo-400 bg-indigo-50" : file ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}
            >
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <>
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-sm font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-green-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">📄</div>
                  <p className="text-sm font-medium text-gray-600">Drop resume here or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or TXT · Max 10MB</p>
                </>
              )}
            </div>
            {file && (
              <button onClick={() => setFile(null)} className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
                Remove file
              </button>
            )}
          </div>

          {/* JD */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Job Description <span className="text-red-500">*</span></h2>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              placeholder="Paste the full job description here. Include responsibilities, required skills, and any specific requirements..."
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{jdText.length} characters</p>
          </div>

          {/* Extra context */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1 text-sm uppercase tracking-wider">Additional Context</h2>
            <p className="text-xs text-gray-400 mb-4">Any specific things you want to probe? Deal-breakers? Team dynamics?</p>
            <textarea
              value={extraContext}
              onChange={e => setExtraContext(e.target.value)}
              placeholder="e.g. This role requires strong stakeholder management. The candidate will own 3 product lines. Looking for someone with experience in B2B SaaS..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!candidateName || !role || !jdText}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            Generate questions & start interview →
          </button>
          <p className="text-center text-xs text-gray-400">AI will generate 10 tailored questions. Usually takes 10–15 seconds.</p>
        </div>
      </div>
    </div>
  );
}