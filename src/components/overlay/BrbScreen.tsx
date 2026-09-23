"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import type { MatchState } from "@/lib/match/types";

export function BrbScreen({ state }: { state: MatchState }) {
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
      <h1 className="overlay-score mt-2 text-6xl tracking-[0.08em] md:text-8xl">
        BRB
      </h1>
      <p className="mt-4 max-w-xl text-center font-[family-name:var(--font-open-sans)] text-lg font-light text-white/85">
        {state.brbMessage ?? "Kurze Pause – gleich geht’s weiter."}
      </p>
      <div className="overlay-glass overlay-glass-accent mt-10 px-8 py-4 text-center">
        <div className="overlay-score text-3xl md:text-4xl">
          {state.teamA.name}
          <span className="mx-3 text-[var(--brand-accent)]">vs</span>
          {state.teamB.name}
        </div>
        <div className="mt-1 text-sm tracking-[0.2em] text-white/55 uppercase">
          Gesamt {state.sessionWins.a}:{state.sessionWins.b}
        </div>
      </div>
    </motion.div>
  );
}
