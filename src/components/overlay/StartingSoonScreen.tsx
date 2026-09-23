"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import type { MatchState } from "@/lib/match/types";

export function StartingSoonScreen({ state }: { state: MatchState }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="overlay-soon-bg absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden px-8 py-8 text-white md:px-12 md:py-10"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 25%, transparent 72%)",
          }}
        />
      </div>

      <motion.div
        className="relative flex max-h-full w-full max-w-4xl flex-col items-center"
        initial={reduceMotion ? false : { y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.05 }}
      >
        <BrandMark
          size={96}
          priority
          className="mb-5 shrink-0 drop-shadow-[0_8px_28px_rgba(6,147,227,0.4)]"
        />
        <p className="text-sm tracking-[0.35em] text-[var(--brand-accent)] uppercase">
          Tischfußball Club Florstadt
        </p>
        <h1 className="overlay-score mt-1 text-5xl tracking-[0.08em] sm:text-6xl md:text-7xl">
          Starting Soon
        </h1>
        <p className="mt-3 max-w-xl text-center font-[family-name:var(--font-open-sans)] text-base font-light text-white/85 md:text-lg">
          {state.startingMessage ??
            "Tischfußball ist unsere Leidenschaft – die Wetterau unsere Heimat."}
        </p>
      </motion.div>

      <div className="overlay-glass overlay-glass-accent relative mt-8 w-full max-w-3xl shrink-0 px-6 py-5 md:mt-10 md:px-10 md:py-6">
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0 flex-1 text-center">
            <div className="text-xs tracking-[0.22em] text-[var(--brand-accent)] uppercase">
              Team A
            </div>
            <div className="overlay-score mt-1 truncate text-4xl md:text-5xl">
              {state.teamA.name}
            </div>
          </div>
          <div className="overlay-score shrink-0 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-2xl text-white/70">
            VS
          </div>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-xs tracking-[0.22em] text-[var(--brand-accent)] uppercase">
              Team B
            </div>
            <div className="overlay-score mt-1 truncate text-4xl md:text-5xl">
              {state.teamB.name}
            </div>
          </div>
        </div>
      </div>

      <p className="relative mt-6 shrink-0 text-sm tracking-[0.28em] text-white/55 uppercase md:mt-8">
        twitch.tv/tfcflorstadt
      </p>
    </motion.div>
  );
}
