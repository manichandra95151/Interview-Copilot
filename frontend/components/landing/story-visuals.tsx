"use client";

import { motion, type Variants } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** Shared framed canvas for every story visual. */
function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="relative bg-white rounded-2xl border border-[#ECE8DF] shadow-[0_30px_70px_-40px_rgba(26,26,26,0.35)] overflow-hidden"
    >
      <div className="bg-[#FBFAF7] border-b border-[#ECE8DF] px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E0DBCF]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#E0DBCF]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#E0DBCF]" />
        </div>
        <span className="mx-auto text-[11px] text-[#9C978C] font-medium tracking-wide">{label}</span>
      </div>
      <div className="p-6 min-h-[340px] flex flex-col justify-center">{children}</div>
    </motion.div>
  );
}

/* ── 1. Shortlist ─────────────────────────────────────────── */
export function ShortlistViz() {
  const rows = [
    { n: "Priya Natarajan", s: 96, top: true },
    { n: "Marcus Lee", s: 91, top: true },
    { n: "Dana Whitfield", s: 68 },
    { n: "Tom Alvarez", s: 54 },
    { n: "Rhea Kapoor", s: 41 },
  ];
  return (
    <Frame label="Resume pool — ranked by fit">
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.n}
            variants={item}
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${
              r.top ? "border-[#4F46E5]/30 bg-[#EEF0FF]/60" : "border-[#ECE8DF] bg-white"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.top ? "bg-[#4F46E5] text-white" : "bg-[#F5F3EE] text-[#9C978C]"}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">{r.n}</p>
              <div className="mt-1.5 h-1.5 bg-[#F1EEE6] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${r.top ? "bg-[#4F46E5]" : "bg-[#C9C2B2]"}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${r.s}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.3 + i * 0.1 }}
                />
              </div>
            </div>
            <span className={`text-xs font-bold tabular-nums ${r.top ? "text-[#4F46E5]" : "text-[#9C978C]"}`} style={{ fontFamily: "var(--font-display)" }}>
              {r.s}
            </span>
            {r.top && (
              <motion.span
                variants={item}
                className="text-[9px] font-bold text-green-700 bg-[#E9F7EF] px-1.5 py-0.5 rounded-md uppercase tracking-wide"
              >
                Top
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </Frame>
  );
}

/* ── 2. Schedule ──────────────────────────────────────────── */
export function ScheduleViz() {
  const days = ["M", "T", "W", "T", "F"];
  const slots = ["9:00", "10:30", "1:00", "3:30"];
  return (
    <Frame label="Schedule & invite">
      <div className="grid grid-cols-5 gap-2 mb-5">
        {days.map((d, i) => (
          <div key={i} className="text-center">
            <p className="text-[10px] text-[#9C978C] font-semibold mb-1.5">{d}</p>
            <div className={`h-9 rounded-lg ${i === 2 ? "bg-[#4F46E5]" : "bg-[#F5F3EE]"} flex items-center justify-center`}>
              <span className={`text-xs font-semibold ${i === 2 ? "text-white" : "text-[#C9C2B2]"}`}>{10 + i}</span>
            </div>
          </div>
        ))}
      </div>
      <motion.div variants={item} className="space-y-2 mb-5">
        {slots.map((t, i) => (
          <motion.div
            key={t}
            variants={item}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${i === 1 ? "border-[#4F46E5]/40 bg-[#EEF0FF]/60" : "border-[#ECE8DF]"}`}
          >
            <span className="text-xs font-medium text-[#1A1A1A]">{t} PM</span>
            {i === 1 && <span className="text-[10px] font-bold text-[#4F46E5]">Selected ✓</span>}
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        variants={item}
        className="flex items-center gap-3 rounded-xl bg-[#1A1A1A] text-white px-4 py-3"
      >
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M3 7l9 6 9-6M3 7v10a1 1 0 001 1h16a1 1 0 001-1V7M3 7l1-1h16l1 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">Invite sent to candidate</p>
          <p className="text-[10px] text-white/50">Secure join link · Wed 2:30 PM</p>
        </div>
        <motion.span
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
          className="text-[#E8A33D] text-lg"
        >
          ✓
        </motion.span>
      </motion.div>
    </Frame>
  );
}

/* ── 3. Interview ─────────────────────────────────────────── */
function TypingLines() {
  const lines = [
    "We had an infrastructure shift mid-project.",
    "I ran a stakeholder alignment session and",
    "documented the new scope within a day…",
  ];
  return (
    <div className="space-y-1.5">
      {lines.map((l, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.4 + i * 0.4, duration: 0.5 }}
          className="text-[11px] text-[#6A665E] italic leading-relaxed"
        >
          {l}
          {i === 2 && <span className="caret-blink">▍</span>}
        </motion.p>
      ))}
    </div>
  );
}
export function InterviewViz() {
  return (
    <Frame label="Live interview — AI copilot">
      <motion.div variants={item} className="mb-3">
        <span className="text-[9px] font-bold text-[#4F46E5] bg-[#EEF0FF] px-2 py-0.5 rounded-full uppercase tracking-[0.1em]">Behavioral</span>
        <p className="text-sm font-semibold mt-2 leading-snug text-[#1A1A1A]" style={{ fontFamily: "var(--font-display)" }}>
          Tell me about navigating a major scope change.
        </p>
      </motion.div>

      <motion.div variants={item} className="rounded-xl bg-[#FBFAF7] border border-[#ECE8DF] p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full rec-pulse" />
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-[0.1em]">Transcribing</span>
        </div>
        <TypingLines />
      </motion.div>

      <div className="grid grid-cols-5 gap-3">
        <motion.div variants={item} className="col-span-2 rounded-xl bg-[#EEF0FF] p-3 flex flex-col items-center justify-center">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#fff" strokeWidth="5" />
            <motion.circle
              cx="28" cy="28" r="22" fill="none" stroke="#4F46E5" strokeWidth="5" strokeLinecap="round"
              transform="rotate(-90 28 28)"
              strokeDasharray={2 * Math.PI * 22}
              initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
              whileInView={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - 0.8) }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EASE, delay: 0.5 }}
            />
            <text x="28" y="33" textAnchor="middle" fontSize="16" fontWeight="700" fill="#4F46E5" style={{ fontFamily: "var(--font-display)" }}>8</text>
          </svg>
          <span className="text-[9px] text-[#4F46E5] font-semibold uppercase tracking-wide mt-1">Live score</span>
        </motion.div>
        <motion.div
          variants={item}
          className="col-span-3 rounded-xl bg-[#FBF2DF] border border-amber-100 p-3 flex items-center"
        >
          <p className="text-[11px] text-[#92610F] leading-snug">
            <span className="font-bold">Suggested follow-up:</span> How did you keep stakeholders aligned afterward?
          </p>
        </motion.div>
      </div>
    </Frame>
  );
}

/* ── 4. Analyze ───────────────────────────────────────────── */
export function AnalyzeViz() {
  const strengths = ["Clear change-management instinct", "Strong stakeholder communication", "Data-backed decisions"];
  const gaps = ["Limited scale experience", "Vague on measurement"];
  return (
    <Frame label="Candidate report">
      <motion.div variants={item} className="flex items-center justify-between mb-4 rounded-xl bg-[#E9F7EF] border border-green-100 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Verdict</p>
          <p className="text-lg font-semibold text-green-800" style={{ fontFamily: "var(--font-display)" }}>Recommend Hire</p>
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -12 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.5, type: "spring", stiffness: 260 }}
          className="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg"
        >
          ✓
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-2">Strengths</p>
          <div className="space-y-1.5">
            {strengths.map((s, i) => (
              <motion.div key={i} variants={item} className="flex items-start gap-1.5">
                <span className="text-green-500 text-xs mt-0.5">✓</span>
                <span className="text-[11px] text-[#6A665E] leading-snug">{s}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#92610F] uppercase tracking-wide mb-2">Gaps</p>
          <div className="space-y-1.5">
            {gaps.map((g, i) => (
              <motion.div key={i} variants={item} className="flex items-start gap-1.5">
                <span className="text-[#E8A33D] text-xs mt-0.5">!</span>
                <span className="text-[11px] text-[#6A665E] leading-snug">{g}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

export const STORY_VISUALS = [ShortlistViz, ScheduleViz, InterviewViz, AnalyzeViz];
