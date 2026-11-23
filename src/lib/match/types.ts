export type {
  DestinationView,
  KickerColor,
  MatchFormat,
  OverlayMessageSlot,
  RoomMutation,
  TeamSide,
} from "./schema";

import type { DestinationView, KickerColor, MatchFormat } from "./schema";

export type ActiveView = DestinationView | "transition";

export type GameType = "doppel" | "einzel";

/** Goals scored in a single set (not sets won). */
export type SetScore = { a: number; b: number };

export type MatchHistoryEntry = {
  teamA: string;
  teamB: string;
  /** Sets won in that game */
  scoreA: number;
  scoreB: number;
  /** Goal totals per set, e.g. 5:3 · 4:5 · 8:6 */
  setScores?: SetScore[];
  elapsedMs: number;
  finishedAt: number;
  gameType?: GameType;
  lineupIndex?: number;
};

export type MatchState = {
  activeView: ActiveView;
  transitionTo: DestinationView | null;
  /** Goals in the current set */
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  teamAColor: KickerColor;
  teamBColor: KickerColor;
  /** Optional club crest URL (e.g. TFVH sportsmanager). */
  teamALogo: string | null;
  teamBLogo: string | null;
  /** Sets won in the current game (Doppel/Einzel) */
  sets: { a: number; b: number };
  /** Completed sets in the current game (goal totals), cleared when the game finishes. */
  setScores: SetScore[];
  matchFormat: MatchFormat;
  /** 0–9 index in GAME_LINEUP */
  lineupIndex: number;
  gameType: GameType;
  timer: {
    running: boolean;
    startedAt: number | null;
    elapsedMs: number;
  };
  startingMessage: string | null;
  brbMessage: string | null;
  endingMessage: string | null;
  history: MatchHistoryEntry[];
  /** Gesamt: won sets across the whole match */
  sessionWins: { a: number; b: number };
  /** True after the last lineup slot finishes — Ending screen is the default destination. */
  sessionComplete: boolean;
  /** Overlay SFX (played in OBS browser source) */
  sfxEnabled: boolean;
  /** 0–1 */
  sfxVolume: number;
  /** Bumped to trigger a one-shot SFX test on overlay clients */
  sfxPing: number;
  updatedAt: number;
  revision: number;
};

export type RoomRecord = {
  id: string;
  pinHash: string;
  state: MatchState;
  updatedAt: number;
};
