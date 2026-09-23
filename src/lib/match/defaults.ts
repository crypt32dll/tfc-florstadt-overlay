/**
 * @deprecated Prefer `@/lib/match/engine`, `migrate`, or `format` directly.
 * Kept as a thin barrel so older imports keep resolving.
 */
export { applyMutation, createInitialState } from "./engine";
export { formatTimer, getElapsedMs } from "./format";
export { normalizeState } from "./migrate";
export { GAME_LINEUP, isSetComplete, setsToWin } from "./rules";
