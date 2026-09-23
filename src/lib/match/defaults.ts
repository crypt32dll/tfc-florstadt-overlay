import type { MatchState, RoomMutation } from "./types";

export function createInitialState(
  teamA = "TFC Florstadt",
  teamB = "",
): MatchState {
  return {
    activeView: "startingSoon",
    transitionTo: null,
    teamA: { name: teamA, score: 0 },
    teamB: { name: teamB, score: 0 },
    targetScore: null,
    timer: { running: false, startedAt: null, elapsedMs: 0 },
    startingMessage: "Gleich geht’s los",
    history: [],
    sessionWins: { a: 0, b: 0 },
    updatedAt: Date.now(),
    revision: 1,
  };
}

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

function bump(state: MatchState): MatchState {
  return {
    ...state,
    updatedAt: Date.now(),
    revision: state.revision + 1,
  };
}

export function applyMutation(
  state: MatchState,
  mutation: RoomMutation,
): MatchState {
  switch (mutation.type) {
    case "goal": {
      const key = mutation.side === "a" ? "teamA" : "teamB";
      const nextScore = Math.max(0, state[key].score + mutation.delta);
      return bump({
        ...state,
        [key]: { ...state[key], score: nextScore },
      });
    }
    case "setName": {
      const key = mutation.side === "a" ? "teamA" : "teamB";
      return bump({
        ...state,
        [key]: { ...state[key], name: mutation.name },
      });
    }
    case "timer": {
      if (mutation.action === "start") {
        if (state.timer.running) return state;
        return bump({
          ...state,
          timer: {
            ...state.timer,
            running: true,
            startedAt: Date.now(),
          },
        });
      }
      if (mutation.action === "pause") {
        if (!state.timer.running) return state;
        return bump({
          ...state,
          timer: {
            running: false,
            startedAt: null,
            elapsedMs: getElapsedMs(state),
          },
        });
      }
      return bump({
        ...state,
        timer: { running: false, startedAt: null, elapsedMs: 0 },
      });
    }
    case "resetMatch": {
      return bump({
        ...state,
        teamA: { ...state.teamA, score: 0 },
        teamB: { ...state.teamB, score: 0 },
        timer: { running: false, startedAt: null, elapsedMs: 0 },
        activeView: state.activeView === "transition" ? "live" : state.activeView,
        transitionTo: null,
      });
    }
    case "finishMatch": {
      const elapsedMs = getElapsedMs(state);
      const winner =
        state.teamA.score === state.teamB.score
          ? null
          : state.teamA.score > state.teamB.score
            ? "a"
            : "b";
      return bump({
        ...state,
        history: [
          {
            teamA: state.teamA.name,
            teamB: state.teamB.name,
            scoreA: state.teamA.score,
            scoreB: state.teamB.score,
            elapsedMs,
            finishedAt: Date.now(),
          },
          ...state.history,
        ].slice(0, 20),
        sessionWins: {
          a: state.sessionWins.a + (winner === "a" ? 1 : 0),
          b: state.sessionWins.b + (winner === "b" ? 1 : 0),
        },
        teamA: { ...state.teamA, score: 0 },
        teamB: { ...state.teamB, score: 0 },
        timer: { running: false, startedAt: null, elapsedMs: 0 },
        activeView: "transition",
        transitionTo: "standings",
      });
    }
    case "setView": {
      if (state.activeView === mutation.view) return state;
      if (state.activeView === "transition") return state;
      return bump({
        ...state,
        activeView: "transition",
        transitionTo: mutation.view,
      });
    }
    case "transitionComplete": {
      if (state.activeView !== "transition" || !state.transitionTo) {
        return state;
      }
      return bump({
        ...state,
        activeView: state.transitionTo,
        transitionTo: null,
      });
    }
    case "setStartingMessage": {
      return bump({ ...state, startingMessage: mutation.message });
    }
    case "swapSides": {
      return bump({
        ...state,
        teamA: state.teamB,
        teamB: state.teamA,
        sessionWins: { a: state.sessionWins.b, b: state.sessionWins.a },
      });
    }
    case "setTargetScore": {
      return bump({ ...state, targetScore: mutation.targetScore });
    }
    default:
      return state;
  }
}
