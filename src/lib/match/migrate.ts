import { GAME_LINEUP } from "./rules";
import type { MatchState } from "./types";

/**
 * Backfill fields for rooms saved before set-based scoring / SFX / format.
 * Ingress only (actions + useRoomState) — leaves assume normalized MatchState.
 */
export function normalizeState(raw: MatchState): MatchState {
  const legacy = raw as MatchState & { targetScore?: unknown };
  const { targetScore: _strip, ...rest } = legacy;
  void _strip;

  const lineupIndex = Math.min(
    Math.max(0, rest.lineupIndex ?? 0),
    GAME_LINEUP.length - 1,
  );
  return {
    ...rest,
    sets: rest.sets ?? { a: 0, b: 0 },
    matchFormat: rest.matchFormat === "bestOf5" ? "bestOf5" : "bestOf3",
    lineupIndex,
    gameType: rest.gameType ?? GAME_LINEUP[lineupIndex],
    brbMessage: rest.brbMessage ?? "Kurze Pause – gleich geht’s weiter.",
    endingMessage:
      rest.endingMessage ?? "Follow für die nächsten Matches aus der Wetterau.",
    sfxEnabled: rest.sfxEnabled ?? true,
    sfxVolume:
      typeof rest.sfxVolume === "number"
        ? Math.min(1, Math.max(0, rest.sfxVolume))
        : 0.7,
    sfxPing: rest.sfxPing ?? 0,
  };
}
