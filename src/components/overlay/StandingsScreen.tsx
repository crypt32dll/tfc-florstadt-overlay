"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { formatTimer } from "@/lib/match/format";
import type { MatchState } from "@/lib/match/types";

export function StandingsScreen({
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
      className="pointer-events-none absolute top-1/2 left-1/2 z-20 w-[min(1120px,94%)] -translate-x-1/2 -translate-y-1/2"
      initial={skipMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={skipMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{
        duration: skipMotion ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="overlay-glass overlay-glass-accent overflow-hidden">
        <div className="flex items-center justify-between gap-5 border-b border-white/12 px-6 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <BrandMark size={56} />
            <div>
              <div className="text-[0.75rem] tracking-[0.2em] text-[var(--brand-accent)] uppercase">
                Sätze gesamt
              </div>
              <h2 className="overlay-score text-4xl leading-none md:text-5xl">
                Zwischenstand
              </h2>
            </div>
          </div>
          <div className="rounded-[var(--radius-control)] border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/15 px-5 py-2.5 text-center">
            <div className="text-[0.7rem] tracking-[0.18em] text-white/60 uppercase">
              Gesamt
            </div>
            <div className="overlay-score text-4xl text-[var(--brand-accent)] md:text-5xl">
              {state.sessionWins.a}:{state.sessionWins.b}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 md:px-8">
          {state.history.length === 0 ? (
            <p className="py-10 text-center font-[family-name:var(--font-open-sans)] text-lg font-light text-white/75">
              Noch keine beendeten Spiele in dieser Session.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {state.history.slice(0, 10).map((game, i) => (
                <li
                  key={`${game.finishedAt}-${i}`}
                  className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-4 rounded-lg px-3 py-3 odd:bg-white/[0.04]"
                >
                  <span className="w-20 text-[0.75rem] tracking-wide text-white/45 uppercase">
                    {(game.lineupIndex ?? state.history.length - 1 - i) + 1}.{" "}
                    {game.gameType === "einzel" ? "Einzel" : "Doppel"}
                  </span>
                  <span className="overlay-score truncate text-right text-3xl">
                    {game.teamA}
                  </span>
                  <span className="overlay-score min-w-[5.5rem] text-center text-4xl tabular-nums">
                    <span
                      className={
                        game.scoreA > game.scoreB
                          ? "text-[var(--brand-accent)]"
                          : undefined
                      }
                    >
                      {game.scoreA}
                    </span>
                    <span className="text-white/40">:</span>
                    <span
                      className={
                        game.scoreB > game.scoreA
                          ? "text-[var(--brand-accent)]"
                          : undefined
                      }
                    >
                      {game.scoreB}
                    </span>
                  </span>
                  <span className="overlay-score truncate text-3xl">
                    {game.teamB}
                  </span>
                  <span className="w-16 text-right text-base text-white/55 tabular-nums">
                    {formatTimer(game.elapsedMs)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
