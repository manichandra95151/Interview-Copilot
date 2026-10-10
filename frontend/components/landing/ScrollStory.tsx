"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { STORY_VISUALS } from "./story-visuals";

const EASE = [0.22, 1, 0.36, 1] as const;

const STAGES = [
  {
    tag: "Shortlist",
    title: "The right candidates, surfaced in seconds.",
    body: "Drop in a pool of resumes and a job description. Retrieval-augmented matching reads every resume, scores fit against the role, and ranks your shortlist — with the evidence to back each rank.",
  },
  {
    tag: "Schedule",
    title: "From shortlist to calendar, without the back-and-forth.",
    body: "Pick a slot and send a branded invite with a secure join link. The candidate gets everything they need; you get a session that's ready the moment they arrive.",
  },
  {
    tag: "Interview",
    title: "A copilot in the room, not in the way.",
    body: "As the candidate speaks, CopilotHire transcribes live, scores each answer, and quietly suggests the follow-up worth asking — so you can stay present in the conversation.",
  },
  {
    tag: "Analyze",
    title: "A calibrated verdict you can defend.",
    body: "Every answer rolls up into evidence-backed strengths, honest gaps, and one clear recommendation — ready to share with your panel before the debrief even starts.",
  },
];

export function ScrollStory() {
  const [active, setActive] = useState(0);
  const ActiveViz = STORY_VISUALS[active];

  return (
    <section className="relative bg-white border-y border-[#ECE8DF]">
      {/* Section intro */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-4 text-center">
        <p className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.14em] mb-3">How it works</p>
        <h2 className="text-4xl sm:text-[44px] font-semibold tracking-tight leading-tight max-w-2xl mx-auto">
          One quiet workflow, from <span className="accent-serif">pile</span> to <span className="amber-serif">panel</span>.
        </h2>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:grid lg:grid-cols-2 lg:gap-16">
        {/* Left — scrolling narrative */}
        <div>
          {STAGES.map((s, i) => (
            <div key={i} className="min-h-[70vh] lg:min-h-screen flex flex-col justify-center py-14">
              <motion.div
                onViewportEnter={() => setActive(i)}
                viewport={{ amount: 0.6, margin: "-15% 0px -35% 0px" }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-mono font-semibold text-[#C9C2B2]">
                    0{i + 1}
                  </span>
                  <span className="h-px w-8 bg-[#E0DBCF]" />
                  <span className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-[0.14em]">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-[28px] sm:text-[32px] font-semibold leading-[1.15] tracking-tight mb-4">
                  {s.title}
                </h3>
                <p className="text-[#6A665E] leading-relaxed text-[15px] max-w-md">{s.body}</p>
              </motion.div>

              {/* Inline visual on mobile */}
              <div className="lg:hidden mt-8">
                {(() => {
                  const Viz = STORY_VISUALS[i];
                  return <Viz />;
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Right — sticky visual (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen flex items-center">
            <div className="w-full">
              {/* progress rail */}
              <div className="flex items-center gap-2 mb-6">
                {STAGES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === active ? "w-10 bg-[#4F46E5]" : "w-5 bg-[#E0DBCF]"
                    }`}
                  />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <ActiveViz />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
