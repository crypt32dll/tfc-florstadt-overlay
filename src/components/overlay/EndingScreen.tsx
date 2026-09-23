"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import type { MatchState } from "@/lib/match/types";

export function EndingScreen({ state }: { state: MatchState }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="overlay-soon-bg absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden px-8 py-8 text-white md:px-12"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
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
        {state.endingMessage ??
          "Follow für die nächsten Matches aus der Wetterau."}
      </p>
      <div className="overlay-glass overlay-glass-accent mt-10 w-full max-w-3xl px-6 py-5 md:px-8">
        <div className="text-center text-xs tracking-[0.22em] text-[var(--brand-accent)] uppercase">
          Endstand Session
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:gap-5">
          <div className="overlay-score truncate text-right text-3xl leading-none md:text-4xl">
            {state.teamA.name}
          </div>
          <div className="overlay-score flex items-center justify-center gap-2 text-5xl leading-none tabular-nums md:text-6xl">
            <span className="inline-block w-[1.05em] text-center">
              {state.sessionWins.a}
            </span>
            <span className="text-[0.62em] text-[var(--brand-accent)]">:</span>
            <span className="inline-block w-[1.05em] text-center">
              {state.sessionWins.b}
            </span>
          </div>
          <div className="overlay-score truncate text-left text-3xl leading-none md:text-4xl">
            {state.teamB.name}
          </div>
        </div>
      </div>
      <p className="mt-8 text-sm tracking-[0.28em] text-white/55 uppercase">
        twitch.tv/tfcflorstadt
      </p>
    </motion.div>
  );
}
