import { localizeCrestUrl } from "@/lib/tfvh/localize-crest";
import { GAME_LINEUP } from "./rules";
import { KICKER_COLORS } from "./schema";
import type {
  KickerColor,
  MatchHistoryEntry,
  MatchState,
  SetScore,
} from "./types";

function asSetScores(value: unknown): SetScore[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as { a?: unknown; b?: unknown };
      if (typeof row.a !== "number" || typeof row.b !== "number") return null;
      return { a: row.a, b: row.b };
    })
    .filter((entry): entry is SetScore => entry != null);
}

function normalizeHistory(raw: unknown): MatchHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const game = entry as MatchHistoryEntry;
    return {
      ...game,
      setScores: asSetScores(game.setScores),
    };
  });
}

function asKickerColor(value: unknown, fallback: KickerColor): KickerColor {
  return KICKER_COLORS.includes(value as KickerColor)
    ? (value as KickerColor)
    : fallback;
}

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
    setScores: asSetScores(rest.setScores),
    history: normalizeHistory(rest.history),
    matchFormat: rest.matchFormat === "bestOf5" ? "bestOf5" : "bestOf3",
    lineupIndex,
    gameType: rest.gameType ?? GAME_LINEUP[lineupIndex],
    teamAColor: asKickerColor(rest.teamAColor, "blue"),
    teamBColor: asKickerColor(rest.teamBColor, "red"),
    teamALogo:
      typeof rest.teamALogo === "string" && rest.teamALogo.length > 0
        ? (localizeCrestUrl(rest.teamALogo) ??
          (rest.teamALogo.startsWith("/crests/") ? rest.teamALogo : null))
        : null,
    teamBLogo:
      typeof rest.teamBLogo === "string" && rest.teamBLogo.length > 0
        ? (localizeCrestUrl(rest.teamBLogo) ??
          (rest.teamBLogo.startsWith("/crests/") ? rest.teamBLogo : null))
        : null,
    brbMessage: rest.brbMessage ?? "Kurze Pause – gleich geht’s weiter.",
    endingMessage:
      rest.endingMessage ?? "Follow für die nächsten Matches aus der Wetterau.",
    sessionComplete: rest.sessionComplete ?? false,
    sfxEnabled: rest.sfxEnabled ?? true,
    sfxVolume:
      typeof rest.sfxVolume === "number"
        ? Math.min(1, Math.max(0, rest.sfxVolume))
        : 0.7,
    sfxPing: rest.sfxPing ?? 0,
  };
}
