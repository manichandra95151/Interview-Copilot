"use client";

import { useState } from "react";
import { Badge, Card } from "@/components/ui";

type Criterion = { score: number; evidence: string };
type Mandatory = { requirement: string; met: boolean; evidence: string };

export type Match = {
  candidateId: string;
  name: string;
  email?: string | null;
  score: number | null;
  mandatoryMet: boolean | null;
  criteria?: {
    skills: Criterion;
    experience: Criterion;
    responsibilities: Criterion;
    education: Criterion;
  };
  matchedSkills: string[];
  missingSkills: string[];
  mandatory: Mandatory[];
  strengths: string[];
  gaps: string[];
  summary: string;
  error?: boolean;
};

const CRITERIA_LABELS: Record<string, string> = {
  skills: "Skills",
  experience: "Experience",
  responsibilities: "Responsibilities",
  education: "Education",
};

function ring(score: number | null) {
  if (score == null) return "#9C978C";
  if (score >= 75) return "#16a34a";
  if (score >= 50) return "#E8A33D";
  return "#dc2626";
}

function Bar({ label, value, evidence }: { label: string; value: number; evidence: string }) {
  const color = value >= 75 ? "#16a34a" : value >= 50 ? "#E8A33D" : "#dc2626";
  return (
    <div className="group/bar" title={evidence}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-[#6A665E]">{label}</span>
        <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 bg-[#F1EEE6] rounded-full overflow-hidden">
        <div className="h-full rounded-full fill-bar" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export function MatchCard({ match, rank }: { match: Match; rank: number }) {
  const [open, setOpen] = useState(false);
  const r = ring(match.score);
  const pct = match.score ?? 0;

  if (match.error) {
    return (
      <Card className="opacity-70">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#F5F3EE] text-[#9C978C] flex items-center justify-center text-xs font-bold">{rank}</div>
          <p className="font-semibold text-[#1A1A1A] text-sm">{match.name}</p>
          <span className="ml-auto text-xs text-[#9C978C]">Couldn&apos;t evaluate</span>
        </div>
      </Card>
    );
  }

  return (
    <Card hover className="fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-lg bg-[#EEF0FF] text-[#4F46E5] flex items-center justify-center text-xs font-black">{rank}</div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1A1A1A] text-sm truncate">{match.name}</p>
            {match.email && <p className="text-xs text-[#9C978C] truncate">{match.email}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {match.mandatoryMet === false && (
            <Badge tone="red" title="Missing one or more must-have requirements">Missing must-have</Badge>
          )}
          {match.mandatoryMet === true && <Badge tone="green">Meets must-haves</Badge>}
          <div className="relative" title={`Weighted fit ${pct}/100`}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#F1EEE6" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={r} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)}
                transform="rotate(-90 22 22)" style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
              <text x="22" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill={r} style={{ fontFamily: "var(--font-display)" }}>
                {match.score ?? "—"}
              </text>
            </svg>
          </div>
        </div>
      </div>

      {match.summary && <p className="text-sm text-[#6A665E] leading-relaxed mt-3">{match.summary}</p>}

      {/* Criterion breakdown */}
      {match.criteria && (
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 mt-4">
          {(["skills", "experience", "responsibilities", "education"] as const).map((k) => (
            <Bar key={k} label={CRITERIA_LABELS[k]} value={match.criteria![k].score} evidence={match.criteria![k].evidence} />
          ))}
        </div>
      )}

      {/* Matched / missing skills */}
      {(match.matchedSkills.length > 0 || match.missingSkills.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {match.matchedSkills.map((s) => (
            <span key={`m-${s}`} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#E9F7EF] text-green-700">{s}</span>
          ))}
          {match.missingSkills.map((s) => (
            <span key={`x-${s}`} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#FBF2DF] text-[#92610F] line-through decoration-[#C9821B]/40">{s}</span>
          ))}
        </div>
      )}

      {/* Expandable detail */}
      <button onClick={() => setOpen((v) => !v)} className="mt-4 text-xs font-medium text-[#4F46E5] hover:underline">
        {open ? "Hide detail" : "Evidence, strengths & gaps"}
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-[#F1EEE6] space-y-4 fade-in">
          {match.mandatory.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#9C978C] uppercase tracking-wide mb-2">Must-have requirements</p>
              <div className="space-y-1.5">
                {match.mandatory.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <span className={m.met ? "text-green-600" : "text-red-500"}>{m.met ? "✓" : "✕"}</span>
                    <div>
                      <span className="text-[#1A1A1A] font-medium">{m.requirement}</span>
                      {m.evidence && <span className="text-[#9C978C]"> — {m.evidence}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {match.strengths.length > 0 && (
              <div>
                <Badge tone="green" className="mb-2">Strengths</Badge>
                <ul className="space-y-1">
                  {match.strengths.map((s, i) => <li key={i} className="text-xs text-[#6A665E] flex gap-1.5"><span className="text-green-500">✓</span><span>{s}</span></li>)}
                </ul>
              </div>
            )}
            {match.gaps.length > 0 && (
              <div>
                <Badge tone="amber" className="mb-2">Gaps</Badge>
                <ul className="space-y-1">
                  {match.gaps.map((g, i) => <li key={i} className="text-xs text-[#6A665E] flex gap-1.5"><span className="text-[#E8A33D]">!</span><span>{g}</span></li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
