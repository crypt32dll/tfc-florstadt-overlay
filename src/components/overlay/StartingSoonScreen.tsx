"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { KickerFigure } from "@/components/overlay/KickerFigure";
import type { MatchState } from "@/lib/match/types";

export function StartingSoonScreen({
  state,
  instant = false,
}: {
  state: MatchState;
  instant?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const skipMotion = Boolean(reduceMotion || instant);

  return (
    <motion.div
      className="overlay-soon-bg absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden px-8 py-8 text-white md:px-12 md:py-10"
      initial={skipMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={skipMotion ? undefined : { opacity: 0 }}
      transition={{ duration: skipMotion ? 0 : 0.28 }}
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
        initial={skipMotion ? false : { y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: skipMotion ? 0 : 0.45,
          delay: skipMotion ? 0 : 0.05,
        }}
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
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-5 md:gap-x-8">
          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="overlay-score truncate text-4xl md:text-5xl">
              {state.teamA.name}
            </div>
            <KickerFigure
              color={state.teamAColor}
              size={36}
              className="shrink-0"
            />
          </div>
          <div className="overlay-score flex size-14 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-2xl leading-none text-white/70">
            VS
          </div>
          <div className="flex min-w-0 items-center justify-start gap-2">
            <KickerFigure
              color={state.teamBColor}
              size={36}
              className="shrink-0"
            />
            <div className="overlay-score truncate text-4xl md:text-5xl">
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
