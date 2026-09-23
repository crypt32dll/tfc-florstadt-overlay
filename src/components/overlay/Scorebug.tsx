"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
  }, [mounted, state.timer.running, state.timer.startedAt, state.timer.elapsedMs]);

  // SSR + first client paint: frozen elapsed only (avoids Date.now hydration mismatch)
  if (!mounted || !state.timer.running) {
    return state.timer.elapsedMs;
  }
  return getElapsedMs(state, now);
}

export function Scorebug({ state }: { state: MatchState }) {
  const elapsed = useLiveElapsed(state);
  const pulseKey = `${state.teamA.score}-${state.teamB.score}`;

  return (
    <motion.div
      layoutId="score-panel"
      className="pointer-events-none absolute bottom-10 left-1/2 z-20 w-[min(920px,90%)] -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-sm border-2 border-white/90 bg-black/85 text-white shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-2">
          <BrandLogo width={96} height={40} className="shrink-0 object-contain" />
          <div className="h-10 w-px bg-white/20" />
          <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="truncate text-right font-[family-name:var(--font-teko)] text-2xl uppercase tracking-wide md:text-3xl">
              {state.teamA.name}
            </div>
            <motion.div
              key={pulseKey}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className="flex items-baseline gap-2 font-[family-name:var(--font-teko)] text-5xl leading-none md:text-6xl"
            >
              <span>{state.teamA.score}</span>
              <span className="text-3xl text-[var(--brand-accent)]">:</span>
              <span>{state.teamB.score}</span>
            </motion.div>
            <div className="truncate font-[family-name:var(--font-teko)] text-2xl uppercase tracking-wide md:text-3xl">
              {state.teamB.name}
            </div>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="w-20 text-center font-[family-name:var(--font-teko)] text-2xl tabular-nums text-[var(--brand-accent)] md:text-3xl">
            {formatTimer(elapsed)}
          </div>
        </div>
        {state.targetScore != null && (
          <div className="border-t border-white/10 px-4 py-1 text-center text-xs tracking-widest text-white/70 uppercase">
            First to {state.targetScore}
          </div>
        )}
      </div>
    </motion.div>
  );
}
