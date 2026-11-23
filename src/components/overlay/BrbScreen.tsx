"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { TeamCrest } from "@/components/brand/TeamCrest";
import type { MatchState } from "@/lib/match/types";

export function BrbScreen({
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
      className="overlay-soon-bg absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden px-8 py-8 text-white md:px-12"
      initial={skipMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={skipMotion ? undefined : { opacity: 0 }}
      transition={{ duration: skipMotion ? 0 : 0.28 }}
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
      <div className="overlay-glass overlay-glass-accent mt-10 w-full max-w-4xl px-6 py-5 md:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 md:gap-6">
          <div className="flex min-w-0 items-center justify-end gap-3">
            <TeamCrest
              src={state.teamALogo}
              alt={state.teamA.name}
              size={44}
              priority
            />
            <div className="overlay-score truncate text-right text-3xl md:text-4xl">
              {state.teamA.name}
            </div>
          </div>
          <div className="overlay-score shrink-0 text-2xl text-[var(--brand-accent)] md:text-3xl">
            vs
          </div>
          <div className="flex min-w-0 items-center justify-start gap-3">
            <div className="overlay-score truncate text-left text-3xl md:text-4xl">
              {state.teamB.name}
            </div>
            <TeamCrest
              src={state.teamBLogo}
              alt={state.teamB.name}
              size={44}
              priority
            />
          </div>
        </div>
        <div className="mt-3 text-center text-sm tracking-[0.2em] text-white/55 uppercase">
          Gesamt {state.sessionWins.a}:{state.sessionWins.b}
        </div>
      </div>
    </motion.div>
  );
}
