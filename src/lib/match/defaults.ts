import type { MatchState, RoomMutation, TeamSide } from "./types";
import {
  GAME_LINEUP,
  setsToWin,
  isSetComplete,
  winnerSide,
} from "./rules";

export function createInitialState(
  teamA = "TFC Florstadt",
  teamB = "",
): MatchState {
  return {
    activeView: "startingSoon",
    transitionTo: null,
    teamA: { name: teamA, score: 0 },
    teamB: { name: teamB, score: 0 },
    sets: { a: 0, b: 0 },
    matchFormat: "bestOf3",
    lineupIndex: 0,
    gameType: GAME_LINEUP[0],
    targetScore: null,
    timer: { running: false, startedAt: null, elapsedMs: 0 },
    startingMessage: "Gleich geht’s los",
    brbMessage: "Kurze Pause – gleich geht’s weiter.",
    endingMessage: "Follow für die nächsten Matches aus der Wetterau.",
    history: [],
    sessionWins: { a: 0, b: 0 },
    sfxEnabled: true,
    sfxVolume: 0.7,
    sfxPing: 0,
    updatedAt: Date.now(),
    revision: 1,
  };
}

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
    brbMessage:
      raw.brbMessage ?? "Kurze Pause – gleich geht’s weiter.",
    endingMessage:
      raw.endingMessage ??
      "Follow für die nächsten Matches aus der Wetterau.",
    sfxEnabled: raw.sfxEnabled ?? true,
    sfxVolume:
      typeof raw.sfxVolume === "number"
        ? Math.min(1, Math.max(0, raw.sfxVolume))
        : 0.7,
    sfxPing: raw.sfxPing ?? 0,
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

/** Switch to live scorebug (with logo sting) unless already live / mid-transition. */
function goLive(state: MatchState): MatchState {
  if (state.activeView === "live") return state;
  if (state.activeView === "transition" && state.transitionTo === "live") {
    return state;
  }
  return {
    ...state,
    activeView: "transition",
    transitionTo: "live",
  };
}

function resetGoals(state: MatchState): MatchState {
  return {
    ...state,
    teamA: { ...state.teamA, score: 0 },
    teamB: { ...state.teamB, score: 0 },
  };
}

function pauseTimer(state: MatchState): MatchState {
  if (!state.timer.running) return state;
  return {
    ...state,
    timer: {
      running: false,
      startedAt: null,
      elapsedMs: getElapsedMs(state),
    },
  };
}

function startTimer(state: MatchState): MatchState {
  if (state.timer.running) return state;
  return {
    ...state,
    timer: {
      ...state.timer,
      running: true,
      startedAt: Date.now(),
    },
  };
}

function completeSet(state: MatchState, winner: TeamSide): MatchState {
  const sets = {
    a: state.sets.a + (winner === "a" ? 1 : 0),
    b: state.sets.b + (winner === "b" ? 1 : 0),
  };
  const sessionWins = {
    a: state.sessionWins.a + (winner === "a" ? 1 : 0),
    b: state.sessionWins.b + (winner === "b" ? 1 : 0),
  };
  // Pause clock at set end (game end resets via completeGame)
  let next: MatchState = pauseTimer({
    ...resetGoals(state),
    sets,
    sessionWins,
  });

  const need = setsToWin(state.matchFormat);
  if (sets[winner] >= need) {
    next = completeGame(next);
  }
  return next;
}

function completeGame(state: MatchState): MatchState {
  const elapsedMs = getElapsedMs(state);
  const nextIndex = Math.min(state.lineupIndex + 1, GAME_LINEUP.length - 1);
  const advanced = state.lineupIndex < GAME_LINEUP.length - 1;

  return {
    ...state,
    history: [
      {
        teamA: state.teamA.name,
        teamB: state.teamB.name,
        scoreA: state.sets.a,
        scoreB: state.sets.b,
        elapsedMs,
        finishedAt: Date.now(),
        gameType: state.gameType,
        lineupIndex: state.lineupIndex,
      },
      ...state.history,
    ].slice(0, 20),
    sets: { a: 0, b: 0 },
    teamA: { ...state.teamA, score: 0 },
    teamB: { ...state.teamB, score: 0 },
    timer: { running: false, startedAt: null, elapsedMs: 0 },
    lineupIndex: advanced ? nextIndex : state.lineupIndex,
    gameType: GAME_LINEUP[advanced ? nextIndex : state.lineupIndex],
    activeView: "transition",
    transitionTo: "standings",
  };
}

export function applyMutation(
  state: MatchState,
  mutation: RoomMutation,
): MatchState {
  state = normalizeState(state);

  switch (mutation.type) {
    case "goal": {
      const key = mutation.side === "a" ? "teamA" : "teamB";
      const nextScore = Math.max(0, Math.min(7, state[key].score + mutation.delta));
      if (nextScore === state[key].score) return state;

      let next: MatchState = {
        ...state,
        [key]: { ...state[key], score: nextScore },
      };

      // Scoring from another screen → show live (set/game end may override)
      if (mutation.delta === 1) {
        next = goLive(next);
      }

      next = bump(next);

      // Only auto-complete set on scoring (not undo) — may override to standings
      if (mutation.delta === 1) {
        const a = next.teamA.score;
        const b = next.teamB.score;
        if (isSetComplete(a, b)) {
          const w = winnerSide(a, b);
          if (w) next = bump(completeSet(next, w));
        }
      }
      return next;
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
        return bump(
          goLive({
            ...state,
            timer: {
              ...state.timer,
              running: true,
              startedAt: Date.now(),
            },
          }),
        );
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
        sets: { a: 0, b: 0 },
        lineupIndex: 0,
        gameType: GAME_LINEUP[0],
        sessionWins: { a: 0, b: 0 },
        history: [],
        timer: { running: false, startedAt: null, elapsedMs: 0 },
        activeView: state.activeView === "transition" ? "live" : state.activeView,
        transitionTo: null,
      });
    }
    case "finishMatch": {
      // End current game with current set score (manual)
      return bump(completeGame(state));
    }
    case "finishSet": {
      const w = winnerSide(state.teamA.score, state.teamB.score);
      if (!w || !isSetComplete(state.teamA.score, state.teamB.score)) {
        // Force-complete if someone leads
        if (state.teamA.score === state.teamB.score) return state;
        const lead = state.teamA.score > state.teamB.score ? "a" : "b";
        return bump(completeSet(state, lead));
      }
      return bump(completeSet(state, w));
    }
    case "setView": {
      if (state.activeView === mutation.view) return state;
      if (state.activeView === "transition") return state;
      let next: MatchState = {
        ...state,
        activeView: "transition",
        transitionTo: mutation.view,
      };
      // Live = match is on → start the clock
      if (mutation.view === "live") {
        next = startTimer(next);
      }
      return bump(next);
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
    case "setBrbMessage": {
      return bump({ ...state, brbMessage: mutation.message });
    }
    case "setEndingMessage": {
      return bump({ ...state, endingMessage: mutation.message });
    }
    case "swapSides": {
      return bump({
        ...state,
        teamA: state.teamB,
        teamB: state.teamA,
        sets: { a: state.sets.b, b: state.sets.a },
        sessionWins: { a: state.sessionWins.b, b: state.sessionWins.a },
      });
    }
    case "setMatchFormat": {
      return bump({ ...state, matchFormat: mutation.format });
    }
    case "setTargetScore": {
      // Legacy no-op kept for schema compat — format replaces targetScore
      return bump({ ...state, targetScore: mutation.targetScore });
    }
    case "setSfx": {
      return bump({
        ...state,
        sfxEnabled: mutation.enabled ?? state.sfxEnabled,
        sfxVolume:
          mutation.volume != null
            ? Math.min(1, Math.max(0, mutation.volume))
            : state.sfxVolume,
      });
    }
    case "sfxTest": {
      return bump({
        ...state,
        sfxPing: (state.sfxPing ?? 0) + 1,
        sfxEnabled: true,
      });
    }
    case "setLineupIndex": {
      const index = Math.min(
        Math.max(0, mutation.index),
        GAME_LINEUP.length - 1,
      );
      return bump({
        ...state,
        lineupIndex: index,
        gameType: GAME_LINEUP[index],
        teamA: { ...state.teamA, score: 0 },
        teamB: { ...state.teamB, score: 0 },
        sets: { a: 0, b: 0 },
        timer: { running: false, startedAt: null, elapsedMs: 0 },
      });
    }
    default:
      return state;
  }
}

export { GAME_LINEUP, setsToWin, isSetComplete } from "./rules";
