"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { MatchState } from "@/lib/match/types";

export function StartingSoonScreen({ state }: { state: MatchState }) {
  return (
    <motion.div
      layoutId="score-panel"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0a] px-10 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <BrandLogo
        priority
        width={420}
        height={176}
        className="mb-10 max-w-[70vw] object-contain"
      />
      <h1 className="font-[family-name:var(--font-teko)] text-7xl tracking-[0.08em] uppercase md:text-8xl">
        Starting Soon
      </h1>
      <p className="mt-3 max-w-xl text-center font-[family-name:var(--font-open-sans)] text-lg font-light text-white/80 md:text-xl">
        {state.startingMessage ?? "Tischfußball ist unsere Leidenschaft – die Wetterau unsere Heimat."}
      </p>
      <div className="mt-12 flex w-full max-w-3xl items-center justify-between gap-6 border-t border-white/20 pt-8">
        <div className="flex-1 text-center">
          <div className="text-xs tracking-[0.2em] text-[var(--brand-accent)] uppercase">
            Team A
          </div>
          <div className="mt-1 font-[family-name:var(--font-teko)] text-4xl uppercase">
            {state.teamA.name}
          </div>
        </div>
        <div className="font-[family-name:var(--font-teko)] text-3xl text-white/40">
          VS
        </div>
        <div className="flex-1 text-center">
          <div className="text-xs tracking-[0.2em] text-[var(--brand-accent)] uppercase">
            Team B
          </div>
          <div className="mt-1 font-[family-name:var(--font-teko)] text-4xl uppercase">
            {state.teamB.name}
          </div>
        </div>
      </div>
      <p className="mt-10 text-sm tracking-widest text-white/50 uppercase">
        twitch.tv/tfcflorstadt
      </p>
    </motion.div>
  );
}
