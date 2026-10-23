import type { GameType, MatchFormat, MatchState } from "./types";

/** Standard DFBL-style lineup: 2D · 2E · 2D · 2E · 2D */
export const GAME_LINEUP: GameType[] = [
  "doppel",
  "doppel",
  "einzel",
  "einzel",
  "doppel",
  "doppel",
  "einzel",
  "einzel",
  "doppel",
  "doppel",
];

export function setsToWin(format: MatchFormat): number {
  return format === "bestOf5" ? 3 : 2;
}

/** Deciding set when both sides are one set from winning (Bo3 1:1 / Bo5 2:2). */
export function isDecidingSet(
  state: Pick<MatchState, "sets" | "matchFormat">,
): boolean {
  const need = setsToWin(state.matchFormat);
  return state.sets.a === need - 1 && state.sets.b === need - 1;
}

export function maxGoals(deciding: boolean): number {
  return deciding ? 8 : 5;
}

/**
 * Normal sets: first to 5 (incl. 5:4), no 2-goal lead.
 * Deciding set: to 5 with 2-goal lead; at 4:4 continue to 2 ahead; hard cap 8:7.
 */
export function isSetComplete(
  a: number,
  b: number,
  opts?: { deciding?: boolean },
): boolean {
  const deciding = opts?.deciding ?? false;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);

  if (!deciding) {
    if (hi > 5) return false;
    return hi >= 5;
  }

  if (hi > 8) return false;
  if (hi < 5) return false;
  if (hi === 8) return lo <= 7;
  return hi - lo >= 2;
}

export function winnerSide(a: number, b: number): "a" | "b" | null {
  if (a === b) return null;
  return a > b ? "a" : "b";
}

/** Rebuild session set totals from finished games (history stores sets won). */
export function sessionWinsFromHistory(
  history: { scoreA: number; scoreB: number }[],
): { a: number; b: number } {
  let a = 0;
  let b = 0;
  for (const game of history) {
    a += game.scoreA;
    b += game.scoreB;
  }
  return { a, b };
}
