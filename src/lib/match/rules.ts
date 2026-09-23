import type { GameType, MatchFormat } from "./types";

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

/**
 * Satz: bis 5, 2 Tore Abstand, maximal 7:6 (bzw. 6:7).
 */
export function isSetComplete(a: number, b: number): boolean {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi > 7) return false;
  if (hi < 5) return false;
  if (hi === 7) return lo <= 6;
  return hi - lo >= 2;
}

export function winnerSide(
  a: number,
  b: number,
): "a" | "b" | null {
  if (a === b) return null;
  return a > b ? "a" : "b";
}
