"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { formatTimer } from "@/lib/match/defaults";
import type { MatchState } from "@/lib/match/types";

export function StandingsScreen({ state }: { state: MatchState }) {
  return (
    <motion.div
      layoutId="score-panel"
      className="pointer-events-none absolute top-1/2 left-1/2 z-20 w-[min(880px,88%)] -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <div className="overflow-hidden rounded-sm border-2 border-white/90 bg-black/90 text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-3">
          <BrandLogo width={120} height={50} className="object-contain" />
          <h2 className="font-[family-name:var(--font-teko)] text-4xl tracking-wide uppercase">
            Zwischenstand
          </h2>
          <div className="min-w-24 text-right font-[family-name:var(--font-teko)] text-3xl text-[var(--brand-accent)]">
            {state.sessionWins.a}:{state.sessionWins.b}
          </div>
        </div>
        <div className="px-5 py-4">
          {state.history.length === 0 ? (
            <p className="py-8 text-center font-[family-name:var(--font-open-sans)] font-light text-white/70">
              Noch keine beendeten Spiele in dieser Session.
            </p>
          ) : (
            <ul className="space-y-2">
              {state.history.slice(0, 8).map((game, i) => (
                <li
                  key={`${game.finishedAt}-${i}`}
                  className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-b border-white/10 py-2 last:border-0"
                >
                  <span className="truncate text-right font-[family-name:var(--font-teko)] text-2xl uppercase">
                    {game.teamA}
                  </span>
                  <span className="font-[family-name:var(--font-teko)] text-3xl tabular-nums">
                    {game.scoreA}:{game.scoreB}
                  </span>
                  <span className="truncate font-[family-name:var(--font-teko)] text-2xl uppercase">
                    {game.teamB}
                  </span>
                  <span className="w-14 text-right text-xs text-white/50 tabular-nums">
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
