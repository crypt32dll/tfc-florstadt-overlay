"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { formatTimer, getElapsedMs, normalizeState } from "@/lib/match/defaults";
import { GAME_LINEUP, setsToWin } from "@/lib/match/rules";
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

export function Scorebug({ state: raw }: { state: MatchState }) {
  const state = normalizeState(raw);
  const elapsed = useLiveElapsed(state);
  const pulseKey = `${state.teamA.score}-${state.teamB.score}-${state.sets.a}-${state.sets.b}`;
  const reduceMotion = useReducedMotion();
  const need = setsToWin(state.matchFormat);
  const gameLabel = state.gameType === "doppel" ? "Doppel" : "Einzel";
  const spielNr = state.lineupIndex + 1;

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
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-1.5 text-[0.65rem] tracking-[0.16em] text-white/70 uppercase md:px-5">
          <span>
            Spiel {spielNr}/{GAME_LINEUP.length} · {gameLabel}
          </span>
          <span className="text-[var(--brand-accent)]">
            Sätze {state.sets.a}:{state.sets.b}
            <span className="text-white/40"> (Bo{need * 2 - 1})</span>
          </span>
          <span>
            Gesamt {state.sessionWins.a}:{state.sessionWins.b}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 md:gap-4 md:px-5">
          <BrandMark
            size={48}
            className="shrink-0 drop-shadow-[0_0_12px_rgba(6,147,227,0.45)]"
          />
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
              className="overlay-score flex flex-col items-center leading-none"
            >
              <div className="flex items-baseline gap-2 text-5xl text-white md:text-6xl">
                <span>{state.teamA.score}</span>
                <span className="text-3xl text-[var(--brand-accent)] md:text-4xl">
                  :
                </span>
                <span>{state.teamB.score}</span>
              </div>
              <div className="mt-1 text-[0.6rem] tracking-[0.2em] text-white/50 uppercase">
                Tore · Satz
              </div>
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
