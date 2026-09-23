import { describe, expect, it } from "vitest";
import {
  applyMutation,
  createInitialState,
  normalizeState,
} from "@/lib/match/defaults";
import { isSetComplete, setsToWin, winnerSide } from "@/lib/match/rules";

describe("setsToWin", () => {
  it("maps formats", () => {
    expect(setsToWin("bestOf3")).toBe(2);
    expect(setsToWin("bestOf5")).toBe(3);
  });
});

describe("isSetComplete", () => {
  it("requires 5 with 2-point lead", () => {
    expect(isSetComplete(5, 3)).toBe(true);
    expect(isSetComplete(5, 4)).toBe(false);
    expect(isSetComplete(4, 2)).toBe(false);
  });

  it("allows max 7:6", () => {
    expect(isSetComplete(6, 4)).toBe(true);
    expect(isSetComplete(7, 6)).toBe(true);
    expect(isSetComplete(7, 5)).toBe(true);
    expect(isSetComplete(8, 6)).toBe(false);
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

  it("auto-completes set at 5:3", () => {
    let s = createInitialState("TFC", "Gegner");
    s = { ...s, activeView: "live", teamA: { ...s.teamA, score: 4 }, teamB: { ...s.teamB, score: 3 } };
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
    const s1 = applyMutation(s0, { type: "setSfx", enabled: false, volume: 0.2 });
    expect(s1.sfxEnabled).toBe(false);
    expect(s1.sfxVolume).toBe(0.2);
  });

  it("normalizeState backfills sfx", () => {
    const raw = createInitialState();
    // @ts-expect-error intentional legacy shape
    delete raw.sfxEnabled;
    // @ts-expect-error intentional legacy shape
    delete raw.sfxVolume;
    const n = normalizeState(raw);
    expect(n.sfxEnabled).toBe(true);
    expect(n.sfxVolume).toBe(0.7);
  });
});
