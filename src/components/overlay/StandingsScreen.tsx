"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/brand/BrandMark";
import { TeamCrest } from "@/components/brand/TeamCrest";
import { formatSetScores, formatTimer } from "@/lib/match/format";
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
            <BrandMark size={48} />
            <div>
              <div className="text-[0.75rem] tracking-[0.2em] text-[var(--brand-accent)] uppercase">
                Sätze gesamt
              </div>
              <h2 className="overlay-score text-4xl md:text-5xl">
                Zwischenstand
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[var(--radius-control)] border border-[var(--brand-accent)]/40 bg-[var(--brand-accent)]/15 px-4 py-2.5 md:gap-4 md:px-5">
            <TeamCrest src={state.teamALogo} alt={state.teamA.name} size={36} />
            <div className="text-center">
              <div className="text-[0.7rem] tracking-[0.18em] text-white/60 uppercase">
                Gesamt
              </div>
              <div className="overlay-score text-4xl text-[var(--brand-accent)] md:text-5xl">
                {state.sessionWins.a}:{state.sessionWins.b}
              </div>
            </div>
            <TeamCrest src={state.teamBLogo} alt={state.teamB.name} size={36} />
          </div>
        </div>

        <div className="px-6 py-5 md:px-8">
          {state.history.length === 0 ? (
            <p className="py-10 text-center font-[family-name:var(--font-open-sans)] text-lg font-light text-white/75">
              Noch keine beendeten Spiele in dieser Session.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {state.history.slice(0, 10).map((game, index) => {
                const setDetail = formatSetScores(game.setScores);
                return (
                  <li
                    key={game.finishedAt}
                    className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3 rounded-lg px-3 py-3 odd:bg-white/[0.04] md:gap-4"
                  >
                    <span className="w-20 text-[0.75rem] tracking-wide text-white/45 uppercase">
                      {(game.lineupIndex ?? state.history.length - 1 - index) +
                        1}
                      . {game.gameType === "einzel" ? "Einzel" : "Doppel"}
                    </span>
                    <div className="flex min-w-0 items-center justify-end gap-2.5">
                      <TeamCrest
                        src={state.teamALogo}
                        alt={game.teamA}
                        size={28}
                      />
                      <span className="overlay-score min-w-0 truncate text-right text-3xl leading-none">
                        {game.teamA}
                      </span>
                    </div>
                    <div className="flex min-w-[5.5rem] flex-col items-center justify-center gap-0.5">
                      <span className="overlay-score text-center text-4xl leading-none tabular-nums">
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
                      {setDetail ? (
                        <span className="max-w-[14rem] text-center text-[0.7rem] leading-tight text-white/50 tabular-nums">
                          {setDetail}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 items-center justify-start gap-2.5">
                      <TeamCrest
                        src={state.teamBLogo}
                        alt={game.teamB}
                        size={28}
                      />
                      <span className="overlay-score min-w-0 truncate text-3xl leading-none">
                        {game.teamB}
                      </span>
                    </div>
                    <span className="w-16 text-right text-base text-white/55 tabular-nums">
                      {formatTimer(game.elapsedMs)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
