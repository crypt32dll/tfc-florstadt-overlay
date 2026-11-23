import type { MatchState, SetScore } from "./types";

export function getElapsedMs(state: MatchState, now = Date.now()): number {
  if (state.timer.running && state.timer.startedAt != null) {
    return state.timer.elapsedMs + (now - state.timer.startedAt);
  }
  return state.timer.elapsedMs;
}

export function formatTimer(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** e.g. "5:3 · 4:5 · 8:6" */
export function formatSetScores(setScores: SetScore[] | undefined): string {
  if (!setScores?.length) return "";
  return setScores.map((s) => `${s.a}:${s.b}`).join(" · ");
}
