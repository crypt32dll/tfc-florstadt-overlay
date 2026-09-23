"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { formatTimer, getElapsedMs } from "@/lib/match/defaults";
import type { MatchState } from "@/lib/match/types";
import { useEffect, useState } from "react";

function useLiveElapsed(state: MatchState) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!mounted || !state.timer.running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [
    mounted,
    state.timer.running,
    state.timer.startedAt,
    state.timer.elapsedMs,
  ]);

  if (!mounted || !state.timer.running) {
    return state.timer.elapsedMs;
  }
  return getElapsedMs(state, now);
}

export function Scorebug({ state }: { state: MatchState }) {
  const elapsed = useLiveElapsed(state);
  const pulseKey = `${state.teamA.score}-${state.teamB.score}`;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId="score-panel"
      className="pointer-events-none absolute bottom-10 left-1/2 z-20 w-[min(980px,92%)] -translate-x-1/2"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="overlay-glass overlay-glass-accent overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-5">
          <BrandMark size={48} className="shrink-0 drop-shadow-[0_0_12px_rgba(6,147,227,0.45)]" />
          <div className="overlay-divider h-11" />
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-4">
            <div className="overlay-score truncate text-right text-2xl text-white md:text-3xl">
              {state.teamA.name}
            </div>
            <motion.div
              key={pulseKey}
              initial={reduceMotion ? false : { scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.28 }}
              className="overlay-score flex items-baseline gap-2 text-5xl leading-none text-white md:text-6xl"
            >
              <span>{state.teamA.score}</span>
              <span className="text-3xl text-[var(--brand-accent)] md:text-4xl">
                :
              </span>
              <span>{state.teamB.score}</span>
            </motion.div>
            <div className="overlay-score truncate text-2xl text-white md:text-3xl">
              {state.teamB.name}
            </div>
          </div>
          <div className="overlay-divider h-11" />
          <div className="min-w-[4.5rem] text-center">
            <div className="text-[0.65rem] tracking-[0.18em] text-white/55 uppercase">
              Zeit
            </div>
            <div className="overlay-score text-2xl text-[var(--brand-accent)] tabular-nums md:text-3xl">
              {formatTimer(elapsed)}
            </div>
          </div>
        </div>
        {state.targetScore != null && (
          <div className="border-t border-white/10 bg-[var(--brand-accent)]/15 px-4 py-1.5 text-center text-xs tracking-[0.2em] text-white uppercase">
            First to {state.targetScore}
          </div>
        )}
        {state.timer.running && (
          <div className="h-0.5 w-full overflow-hidden bg-white/10">
            <div
              className="h-full w-full bg-[var(--brand-accent)]"
              style={
                reduceMotion
                  ? { opacity: 0.85 }
                  : { animation: "overlay-pulse 1.8s ease-in-out infinite" }
              }
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
