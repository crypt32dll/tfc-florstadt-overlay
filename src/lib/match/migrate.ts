import { GAME_LINEUP } from "./rules";
import type { MatchState } from "./types";

/** Backfill fields for rooms saved before set-based scoring. */
export function normalizeState(raw: MatchState): MatchState {
  const lineupIndex = Math.min(
    Math.max(0, raw.lineupIndex ?? 0),
    GAME_LINEUP.length - 1,
  );
  return {
    ...raw,
    sets: raw.sets ?? { a: 0, b: 0 },
    matchFormat: raw.matchFormat === "bestOf5" ? "bestOf5" : "bestOf3",
    lineupIndex,
    gameType: raw.gameType ?? GAME_LINEUP[lineupIndex],
    brbMessage: raw.brbMessage ?? "Kurze Pause – gleich geht’s weiter.",
    endingMessage:
      raw.endingMessage ?? "Follow für die nächsten Matches aus der Wetterau.",
    sfxEnabled: raw.sfxEnabled ?? true,
    sfxVolume:
      typeof raw.sfxVolume === "number"
        ? Math.min(1, Math.max(0, raw.sfxVolume))
        : 0.7,
    sfxPing: raw.sfxPing ?? 0,
  };
}
