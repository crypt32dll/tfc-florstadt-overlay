export type {
  DestinationView,
  MatchFormat,
  OverlayMessageSlot,
  RoomMutation,
  TeamSide,
} from "./schema";

import type { DestinationView, MatchFormat } from "./schema";

export type ActiveView = DestinationView | "transition";

export type GameType = "doppel" | "einzel";

export type MatchHistoryEntry = {
  teamA: string;
  teamB: string;
  /** Sets won in that game */
  scoreA: number;
  scoreB: number;
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
  /** Sets won in the current game (Doppel/Einzel) */
  sets: { a: number; b: number };
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
