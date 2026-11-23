"use client";

import { useEffect, useState } from "react";
import { formatSetScores, formatTimer } from "@/lib/match/format";
import type { MatchHistoryEntry } from "@/lib/match/types";

type Props = {
  history: MatchHistoryEntry[];
  pending: boolean;
  onSave: (
    index: number,
    patch: {
      teamA?: string;
      teamB?: string;
      scoreA?: number;
      scoreB?: number;
    },
  ) => void;
  onRemove: (index: number) => void;
};

export function ControlHistory({ history, pending, onSave, onRemove }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="glass-panel space-y-3 p-3">
      <h2 className="text-xs tracking-wide text-muted uppercase">
        Vergangene Spiele
      </h2>
      <ul className="space-y-3">
        {history.map((game, index) => (
          <HistoryRow
            key={game.finishedAt}
            game={game}
            index={index}
            pending={pending}
            onSave={onSave}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  );
}

function HistoryRow({
  game,
  index,
  pending,
  onSave,
  onRemove,
}: {
  game: MatchHistoryEntry;
  index: number;
  pending: boolean;
  onSave: (
    index: number,
    patch: {
      teamA?: string;
      teamB?: string;
      scoreA?: number;
      scoreB?: number;
    },
  ) => void;
  onRemove: (index: number) => void;
}) {
  const [teamA, setTeamA] = useState(game.teamA);
  const [teamB, setTeamB] = useState(game.teamB);
  const [scoreA, setScoreA] = useState(String(game.scoreA));
  const [scoreB, setScoreB] = useState(String(game.scoreB));
  const setDetail = formatSetScores(game.setScores);
  const gameLabel =
    game.gameType === "einzel"
      ? "Einzel"
      : game.gameType === "doppel"
        ? "Doppel"
        : null;

  useEffect(() => {
    setTeamA(game.teamA);
    setTeamB(game.teamB);
    setScoreA(String(game.scoreA));
    setScoreB(String(game.scoreB));
  }, [game.teamA, game.teamB, game.scoreA, game.scoreB]);

  const dirty =
    teamA !== game.teamA ||
    teamB !== game.teamB ||
    Number(scoreA) !== game.scoreA ||
    Number(scoreB) !== game.scoreB;

  return (
    <li className="space-y-2 rounded-[var(--radius-control)] border border-white/10 bg-black/25 p-2.5">
      <div className="flex items-center justify-between gap-2 text-[0.65rem] tracking-wide text-muted uppercase">
        <span>
          {game.lineupIndex != null ? `Spiel ${game.lineupIndex + 1}` : null}
          {game.lineupIndex != null && gameLabel ? " · " : null}
          {gameLabel}
        </span>
        <span className="tabular-nums">{formatTimer(game.elapsedMs)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <input
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          className="glass-input py-1.5 text-sm text-white"
          aria-label={`Spiel ${index + 1} Team A`}
        />
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 font-display text-xl tabular-nums">
            <input
              inputMode="numeric"
              value={scoreA}
              onChange={(e) =>
                setScoreA(e.target.value.replace(/\D/g, "").slice(0, 1))
              }
              className="w-10 rounded border border-white/20 bg-black/40 py-1 text-center text-white"
              aria-label={`Spiel ${index + 1} Sätze A`}
            />
            <span className="text-muted">:</span>
            <input
              inputMode="numeric"
              value={scoreB}
              onChange={(e) =>
                setScoreB(e.target.value.replace(/\D/g, "").slice(0, 1))
              }
              className="w-10 rounded border border-white/20 bg-black/40 py-1 text-center text-white"
              aria-label={`Spiel ${index + 1} Sätze B`}
            />
          </div>
          {setDetail ? (
            <p className="max-w-[11rem] text-center text-[0.7rem] leading-tight text-muted tabular-nums">
              {setDetail}
            </p>
          ) : null}
        </div>
        <input
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          className="glass-input py-1.5 text-sm text-white"
          aria-label={`Spiel ${index + 1} Team B`}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !dirty || !teamA.trim() || !teamB.trim()}
          onClick={() =>
            onSave(index, {
              teamA: teamA.trim(),
              teamB: teamB.trim(),
              scoreA: Math.min(9, Math.max(0, Number(scoreA) || 0)),
              scoreB: Math.min(9, Math.max(0, Number(scoreB) || 0)),
            })
          }
          className="btn btn-primary min-h-10 flex-1 text-sm"
        >
          Speichern
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => onRemove(index)}
          className="btn btn-ghost min-h-10 px-3 text-sm"
        >
          Löschen
        </button>
      </div>
    </li>
  );
}
