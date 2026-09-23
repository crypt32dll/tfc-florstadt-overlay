"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import type { MatchState } from "@/lib/match/types";

export function EndingScreen({ state }: { state: MatchState }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId="score-panel"
      className="overlay-soon-bg absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden px-8 py-8 text-white md:px-12"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4 }}
    >
      <BrandMark
        size={96}
        priority
        className="mb-6 drop-shadow-[0_8px_28px_rgba(6,147,227,0.4)]"
      />
      <p className="text-sm tracking-[0.35em] text-[var(--brand-accent)] uppercase">
        Tischfußball Club Florstadt
      </p>
      <h1 className="overlay-score mt-2 text-5xl tracking-[0.06em] md:text-7xl">
        Danke fürs Zuschauen
      </h1>
      <p className="mt-4 max-w-xl text-center font-[family-name:var(--font-open-sans)] text-lg font-light text-white/85">
        Follow für die nächsten Matches aus der Wetterau.
      </p>
      <div className="overlay-glass overlay-glass-accent mt-10 w-full max-w-2xl px-8 py-5 text-center">
        <div className="text-xs tracking-[0.22em] text-[var(--brand-accent)] uppercase">
          Endstand Session
        </div>
        <div className="overlay-score mt-2 text-5xl md:text-6xl">
          {state.sessionWins.a}
          <span className="mx-2 text-[var(--brand-accent)]">:</span>
          {state.sessionWins.b}
        </div>
        <div className="mt-2 text-sm text-white/70">
          {state.teamA.name} · {state.teamB.name}
        </div>
      </div>
      <p className="mt-8 text-sm tracking-[0.28em] text-white/55 uppercase">
        twitch.tv/tfcflorstadt
      </p>
    </motion.div>
  );
}
