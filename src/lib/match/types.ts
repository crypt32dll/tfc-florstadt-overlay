export type ActiveView = "startingSoon" | "live" | "standings" | "transition";

export type TeamSide = "a" | "b";

export type MatchHistoryEntry = {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  elapsedMs: number;
  finishedAt: number;
};

export type MatchState = {
  activeView: ActiveView;
  transitionTo: Exclude<ActiveView, "transition"> | null;
  teamA: { name: string; score: number };
  teamB: { name: string; score: number };
  targetScore: number | null;
  timer: {
    running: boolean;
    startedAt: number | null;
    elapsedMs: number;
  };
  startingMessage: string | null;
  history: MatchHistoryEntry[];
  sessionWins: { a: number; b: number };
  updatedAt: number;
  revision: number;
};

export type RoomRecord = {
  id: string;
  pinHash: string;
  state: MatchState;
  updatedAt: number;
};

export type RoomMutation =
  | { type: "goal"; side: TeamSide; delta: 1 | -1 }
  | { type: "setName"; side: TeamSide; name: string }
  | { type: "timer"; action: "start" | "pause" | "reset" }
  | { type: "resetMatch" }
  | { type: "finishMatch" }
  | { type: "setView"; view: Exclude<ActiveView, "transition"> }
  | { type: "transitionComplete" }
  | { type: "setStartingMessage"; message: string | null }
  | { type: "swapSides" }
  | { type: "setTargetScore"; targetScore: number | null };
