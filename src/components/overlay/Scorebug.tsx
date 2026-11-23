"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { TeamCrest } from "@/components/brand/TeamCrest";
import { KickerFigure } from "@/components/overlay/KickerFigure";
import { useNow } from "@/lib/hooks/useNow";
import { formatTimer, getElapsedMs } from "@/lib/match/format";
import { GAME_LINEUP, setsToWin } from "@/lib/match/rules";
import type { MatchState } from "@/lib/match/types";

/** Isolates the 250ms tick so Scorebug shell doesn't re-render at 4Hz (rerender-memo). */
function LiveTimerDigits({ state }: { state: MatchState }) {
  const running = state.timer.running;
  const now = useNow(running, 250);

  const elapsed =
    !running || now === 0 ? state.timer.elapsedMs : getElapsedMs(state, now);

  return (
    <div className="overlay-score mt-0.5 text-2xl text-[var(--brand-accent)] tabular-nums md:text-3xl">
      {formatTimer(elapsed)}
    </div>
  );
}

export function Scorebug({
  state,
  instant = false,
}: {
  state: MatchState;
  /** Skip enter/exit while logo sting runs (OBS perf). */
  instant?: boolean;
}) {
  const pulseKey = `${state.teamA.score}-${state.teamB.score}-${state.sets.a}-${state.sets.b}`;
  const reduceMotion = useReducedMotion();
  const skipMotion = Boolean(reduceMotion || instant);
  const need = setsToWin(state.matchFormat);
  const gameLabel = state.gameType === "doppel" ? "Doppel" : "Einzel";
  const spielNr = state.lineupIndex + 1;

  return (
    <motion.div
      className="pointer-events-none absolute bottom-10 left-1/2 z-20 w-[min(1180px,96%)] -translate-x-1/2"
      initial={skipMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={skipMotion ? undefined : { opacity: 0, y: 10 }}
      transition={{
        duration: skipMotion ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="overlay-glass overlay-glass-accent overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 text-[0.8rem] tracking-[0.16em] text-white/70 uppercase md:px-5 md:text-sm">
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
        <div className="grid grid-cols-[5.75rem_minmax(0,1fr)_5.75rem] items-center px-4 py-3 md:grid-cols-[6.5rem_minmax(0,1fr)_6.5rem] md:px-5">
          <div className="flex items-center justify-center">
            <BrandMark
              size={48}
              className="shrink-0 drop-shadow-[0_0_12px_rgba(6,147,227,0.45)]"
            />
          </div>

          <div className="grid min-h-[3.25rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:min-h-[3.75rem] md:gap-4">
            <div className="flex min-w-0 items-center justify-end gap-2.5">
              <TeamCrest
                src={state.teamALogo}
                alt={state.teamA.name}
                size={28}
              />
              <div className="overlay-score min-w-0 truncate text-right text-2xl leading-none text-white md:text-3xl">
                {state.teamA.name}
              </div>
              <KickerFigure color={state.teamAColor} size={28} />
            </div>

            <motion.div
              key={pulseKey}
              initial={reduceMotion ? false : { scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.28 }}
              className="overlay-score flex h-[1em] shrink-0 items-center text-5xl leading-none text-white tabular-nums md:text-6xl"
              aria-label={`Spielstand ${state.teamA.score} zu ${state.teamB.score}`}
            >
              <span className="inline-block w-[1.05em] text-center leading-none">
                {state.teamA.score}
              </span>
              <span className="inline-flex w-[0.55em] items-center justify-center text-[0.62em] leading-none text-[var(--brand-accent)]">
                :
              </span>
              <span className="inline-block w-[1.05em] text-center leading-none">
                {state.teamB.score}
              </span>
            </motion.div>

            <div className="flex min-w-0 items-center justify-start gap-2.5">
              <KickerFigure color={state.teamBColor} size={28} />
              <div className="overlay-score min-w-0 truncate text-left text-2xl leading-none text-white md:text-3xl">
                {state.teamB.name}
              </div>
              <TeamCrest
                src={state.teamBLogo}
                alt={state.teamB.name}
                size={28}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-0.5 text-center">
            <div className="text-[0.65rem] leading-none tracking-[0.18em] text-white/55 uppercase">
              Zeit
            </div>
            <LiveTimerDigits state={state} />
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
