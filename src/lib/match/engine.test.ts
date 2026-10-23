import { describe, expect, it } from "vitest";
import { applyMutation, createInitialState } from "@/lib/match/engine";
import { normalizeState } from "@/lib/match/migrate";
import {
  isDecidingSet,
  isSetComplete,
  maxGoals,
  setsToWin,
  winnerSide,
} from "@/lib/match/rules";

describe("setsToWin", () => {
  it("maps formats", () => {
    expect(setsToWin("bestOf3")).toBe(2);
    expect(setsToWin("bestOf5")).toBe(3);
  });
});

describe("isDecidingSet", () => {
  it("is true at 1:1 in Bo3 and 2:2 in Bo5", () => {
    expect(
      isDecidingSet({ sets: { a: 1, b: 1 }, matchFormat: "bestOf3" }),
    ).toBe(true);
    expect(
      isDecidingSet({ sets: { a: 2, b: 2 }, matchFormat: "bestOf5" }),
    ).toBe(true);
    expect(
      isDecidingSet({ sets: { a: 1, b: 0 }, matchFormat: "bestOf3" }),
    ).toBe(false);
  });
});

describe("isSetComplete", () => {
  it("normal sets: first to 5 including 5:4", () => {
    expect(isSetComplete(5, 3)).toBe(true);
    expect(isSetComplete(5, 4)).toBe(true);
    expect(isSetComplete(4, 2)).toBe(false);
    expect(isSetComplete(6, 4)).toBe(false);
  });

  it("deciding set: 5 with 2-lead, deuce to 2 ahead, cap 8:7", () => {
    expect(isSetComplete(5, 3, { deciding: true })).toBe(true);
    expect(isSetComplete(5, 4, { deciding: true })).toBe(false);
    expect(isSetComplete(6, 4, { deciding: true })).toBe(true);
    expect(isSetComplete(7, 6, { deciding: true })).toBe(false);
    expect(isSetComplete(8, 7, { deciding: true })).toBe(true);
    expect(isSetComplete(8, 6, { deciding: true })).toBe(true);
    expect(isSetComplete(9, 7, { deciding: true })).toBe(false);
  });
});

describe("maxGoals", () => {
  it("clamps normal to 5 and deciding to 8", () => {
    expect(maxGoals(false)).toBe(5);
    expect(maxGoals(true)).toBe(8);
  });
});

describe("winnerSide", () => {
  it("returns lead or null", () => {
    expect(winnerSide(5, 3)).toBe("a");
    expect(winnerSide(2, 5)).toBe("b");
    expect(winnerSide(4, 4)).toBe(null);
  });
});

describe("applyMutation", () => {
  it("scores a goal and bumps revision", () => {
    const s0 = createInitialState("TFC", "Gegner");
    const s1 = applyMutation(s0, { type: "goal", side: "a", delta: 1 });
    expect(s1.teamA.score).toBe(1);
    expect(s1.revision).toBe(s0.revision + 1);
  });

  it("auto-completes normal set at 5:4", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "live",
      teamA: { ...s.teamA, score: 4 },
      teamB: { ...s.teamB, score: 4 },
    };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.teamA.score).toBe(0);
    expect(s.sets.a).toBe(1);
    expect(s.sessionWins.a).toBe(1);
  });

  it("completes best-of-3 game after 2 sets and transitions to standings", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "live",
      matchFormat: "bestOf3",
      sets: { a: 1, b: 0 },
      teamA: { ...s.teamA, score: 4 },
      teamB: { ...s.teamB, score: 2 },
      sessionWins: { a: 1, b: 0 },
    };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.sets).toEqual({ a: 0, b: 0 });
    expect(s.activeView).toBe("transition");
    expect(s.transitionTo).toBe("standings");
    expect(s.lineupIndex).toBe(1);
    expect(s.history.length).toBe(1);
  });

  it("deciding set requires 2-goal lead at 5", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "live",
      matchFormat: "bestOf3",
      sets: { a: 1, b: 1 },
      teamA: { ...s.teamA, score: 4 },
      teamB: { ...s.teamB, score: 4 },
      sessionWins: { a: 1, b: 1 },
    };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.teamA.score).toBe(5);
    expect(s.sets).toEqual({ a: 1, b: 1 });
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.sets).toEqual({ a: 0, b: 0 });
    expect(s.transitionTo).toBe("standings");
  });

  it("deciding set ends at 8:7", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "live",
      matchFormat: "bestOf3",
      sets: { a: 1, b: 1 },
      teamA: { ...s.teamA, score: 7 },
      teamB: { ...s.teamB, score: 7 },
      sessionWins: { a: 1, b: 1 },
    };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.sets).toEqual({ a: 0, b: 0 });
    expect(s.history[0]?.scoreA).toBe(2);
    expect(s.history[0]?.scoreB).toBe(1);
  });

  it("swapSides mirrors history entries", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      history: [
        {
          teamA: "TFC",
          teamB: "Gegner",
          scoreA: 2,
          scoreB: 0,
          elapsedMs: 1000,
          finishedAt: 1,
        },
      ],
      sessionWins: { a: 2, b: 0 },
    };
    s = applyMutation(s, { type: "swapSides" });
    expect(s.teamA.name).toBe("Gegner");
    expect(s.teamB.name).toBe("TFC");
    expect(s.history[0]).toMatchObject({
      teamA: "Gegner",
      teamB: "TFC",
      scoreA: 0,
      scoreB: 2,
    });
    expect(s.sessionWins).toEqual({ a: 0, b: 2 });
  });

  it("editHistory patches entry and rebuilds sessionWins without transition", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "standings",
      history: [
        {
          teamA: "TFC",
          teamB: "Gegner",
          scoreA: 2,
          scoreB: 1,
          elapsedMs: 1000,
          finishedAt: 1,
        },
      ],
      sessionWins: { a: 2, b: 1 },
    };
    s = applyMutation(s, {
      type: "editHistory",
      index: 0,
      scoreA: 1,
      scoreB: 2,
    });
    expect(s.activeView).toBe("standings");
    expect(s.transitionTo).toBeNull();
    expect(s.history[0]?.scoreA).toBe(1);
    expect(s.history[0]?.scoreB).toBe(2);
    expect(s.sessionWins).toEqual({ a: 1, b: 2 });
  });

  it("setTeamColor updates color", () => {
    const s0 = createInitialState();
    const s1 = applyMutation(s0, {
      type: "setTeamColor",
      side: "b",
      color: "green",
    });
    expect(s1.teamBColor).toBe("green");
    expect(s1.teamAColor).toBe("blue");
  });

  it("transitionComplete applies target view", () => {
    let s = createInitialState();
    s = applyMutation(s, { type: "setView", view: "live" });
    expect(s.activeView).toBe("transition");
    expect(s.transitionTo).toBe("live");
    s = applyMutation(s, { type: "transitionComplete" });
    expect(s.activeView).toBe("live");
    expect(s.transitionTo).toBe(null);
  });

  it("finishSet force-completes when leading", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      teamA: { ...s.teamA, score: 3 },
      teamB: { ...s.teamB, score: 1 },
    };
    s = applyMutation(s, { type: "finishSet" });
    expect(s.sets.a).toBe(1);
    expect(s.teamA.score).toBe(0);
  });

  it("setSfx updates flags", () => {
    const s0 = createInitialState();
    const s1 = applyMutation(s0, {
      type: "setSfx",
      enabled: false,
      volume: 0.2,
    });
    expect(s1.sfxEnabled).toBe(false);
    expect(s1.sfxVolume).toBe(0.2);
  });

  it("sfxTest bumps ping", () => {
    const s0 = createInitialState();
    const s1 = applyMutation(s0, { type: "sfxTest" });
    expect(s1.sfxPing).toBe((s0.sfxPing ?? 0) + 1);
    expect(s1.sfxEnabled).toBe(true);
  });

  it("goal from standings switches to live", () => {
    let s = createInitialState("TFC", "Gegner");
    s = { ...s, activeView: "standings", transitionTo: null };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.activeView).toBe("transition");
    expect(s.transitionTo).toBe("live");
    expect(s.teamA.score).toBe(1);
  });

  it("timer start from brb switches to live", () => {
    let s = createInitialState("TFC", "Gegner");
    s = { ...s, activeView: "brb", transitionTo: null };
    s = applyMutation(s, { type: "timer", action: "start" });
    expect(s.activeView).toBe("transition");
    expect(s.transitionTo).toBe("live");
    expect(s.timer.running).toBe(true);
  });

  it("set-winning goal still goes to standings, not live", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "brb",
      matchFormat: "bestOf3",
      sets: { a: 1, b: 0 },
      teamA: { ...s.teamA, score: 4 },
      teamB: { ...s.teamB, score: 2 },
      sessionWins: { a: 1, b: 0 },
    };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.activeView).toBe("transition");
    expect(s.transitionTo).toBe("standings");
  });

  it("setView live starts the timer", () => {
    let s = createInitialState("TFC", "Gegner");
    s = { ...s, activeView: "startingSoon" };
    s = applyMutation(s, { type: "setView", view: "live" });
    expect(s.transitionTo).toBe("live");
    expect(s.timer.running).toBe(true);
    expect(s.timer.startedAt).not.toBeNull();
  });

  it("setView brb/standings pauses the timer and live resumes it", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "live",
      timer: { running: true, startedAt: Date.now() - 3000, elapsedMs: 5000 },
    };
    s = applyMutation(s, { type: "setView", view: "brb" });
    expect(s.transitionTo).toBe("brb");
    expect(s.timer.running).toBe(false);
    expect(s.timer.startedAt).toBeNull();
    expect(s.timer.elapsedMs).toBeGreaterThanOrEqual(8000);

    s = { ...s, activeView: "brb", transitionTo: null };
    s = applyMutation(s, { type: "setView", view: "standings" });
    expect(s.transitionTo).toBe("standings");
    expect(s.timer.running).toBe(false);

    s = { ...s, activeView: "standings", transitionTo: null };
    s = applyMutation(s, { type: "setView", view: "live" });
    expect(s.transitionTo).toBe("live");
    expect(s.timer.running).toBe(true);
    expect(s.timer.startedAt).not.toBeNull();
  });

  it("completing a set pauses the timer and keeps elapsed", () => {
    let s = createInitialState("TFC", "Gegner");
    s = {
      ...s,
      activeView: "live",
      timer: { running: true, startedAt: Date.now() - 5000, elapsedMs: 10_000 },
      teamA: { ...s.teamA, score: 4 },
      teamB: { ...s.teamB, score: 2 },
    };
    s = applyMutation(s, { type: "goal", side: "a", delta: 1 });
    expect(s.sets.a).toBe(1);
    expect(s.timer.running).toBe(false);
    expect(s.timer.startedAt).toBeNull();
    expect(s.timer.elapsedMs).toBeGreaterThanOrEqual(14_000);
  });

  it("normalizeState backfills sfx colors and strips targetScore", () => {
    const raw = createInitialState();
    // @ts-expect-error intentional legacy shape
    delete raw.sfxEnabled;
    // @ts-expect-error intentional legacy shape
    delete raw.sfxVolume;
    // @ts-expect-error intentional legacy shape
    delete raw.teamAColor;
    const withLegacy = { ...raw, targetScore: 5 } as typeof raw & {
      targetScore: number;
    };
    const n = normalizeState(withLegacy as typeof raw);
    expect(n.sfxEnabled).toBe(true);
    expect(n.sfxVolume).toBe(0.7);
    expect(n.teamAColor).toBe("blue");
    expect("targetScore" in n).toBe(false);
  });

  it("setOverlayMessage updates the chosen slot", () => {
    const s0 = createInitialState();
    const s1 = applyMutation(s0, {
      type: "setOverlayMessage",
      slot: "brb",
      message: "Bald weiter",
    });
    expect(s1.brbMessage).toBe("Bald weiter");
    expect(s1.startingMessage).toBe(s0.startingMessage);
  });
});
