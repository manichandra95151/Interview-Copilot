"use client";

import { Badge, Card } from "@/components/ui";

export type Match = {
  candidateId: string;
  name: string;
  email?: string | null;
  similarity: number;
  score: number | null;
  justification: string;
  strengths: string[];
  gaps: string[];
};

function scoreTone(score: number | null) {
  if (score == null) return { tone: "neutral" as const, ring: "#9ca3af" };
  if (score >= 75) return { tone: "green" as const, ring: "#16a34a" };
  if (score >= 50) return { tone: "amber" as const, ring: "#d97706" };
  return { tone: "red" as const, ring: "#dc2626" };
}

export function MatchCard({ match, rank }: { match: Match; rank: number }) {
  const { tone, ring } = scoreTone(match.score);
  const pct = match.score ?? 0;

  return (
    <Card hover className="fade-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-lg bg-[#EEF0FF] text-[#4F46E5] flex items-center justify-center text-xs font-black">
            {rank}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{match.name}</p>
            {match.email && <p className="text-xs text-gray-400 truncate">{match.email}</p>}
          </div>
        </div>
        <div className="relative shrink-0" title={`Fit score ${pct}/100`}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f0fb" strokeWidth="4" />
            <circle
              cx="22" cy="22" r="18" fill="none" stroke={ring} strokeWidth="4"
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - pct / 100)}
              strokeLinecap="round" transform="rotate(-90 22 22)"
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
            />
            <text x="22" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill={ring}>
              {match.score ?? "—"}
            </text>
          </svg>
        </div>
      </div>

      {match.justification && (
        <p className="text-sm text-gray-600 leading-relaxed mt-3">{match.justification}</p>
      )}

      {(match.strengths.length > 0 || match.gaps.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {match.strengths.length > 0 && (
            <div>
              <Badge tone="green" className="mb-2">Strengths</Badge>
              <ul className="space-y-1">
                {match.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-green-500">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {match.gaps.length > 0 && (
            <div>
              <Badge tone="amber" className="mb-2">Gaps</Badge>
              <ul className="space-y-1">
                {match.gaps.map((g, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                    <span className="text-amber-500">!</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-[#F1EEE6] flex items-center gap-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          Semantic similarity
        </span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#4F46E5]/60 rounded-full" style={{ width: `${Math.round(match.similarity * 100)}%` }} />
        </div>
        <span className="text-[10px] font-bold text-gray-400">{Math.round(match.similarity * 100)}%</span>
      </div>
    </Card>
  );
}
