import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/match/engine";
import { memoryStore } from "@/lib/store";

describe("memoryStore.saveIfRevision", () => {
  it("writes when revision matches", async () => {
    const state = createInitialState("A", "B");
    const room = {
      id: `cas-${Date.now()}`,
      pinHash: "x",
      state,
      updatedAt: state.updatedAt,
    };
    await memoryStore.create(room);
    const next = {
      ...room,
      state: { ...state, revision: state.revision + 1, teamA: { ...state.teamA, score: 1 } },
      updatedAt: Date.now(),
    };
    expect(await memoryStore.saveIfRevision(next, state.revision)).toBe("ok");
    const got = await memoryStore.get(room.id);
    expect(got?.state.revision).toBe(state.revision + 1);
    expect(got?.state.teamA.score).toBe(1);
  });

  it("returns conflict when revision diverged", async () => {
    const state = createInitialState("A", "B");
    const room = {
      id: `cas-conflict-${Date.now()}`,
      pinHash: "x",
      state,
      updatedAt: state.updatedAt,
    };
    await memoryStore.create(room);
    const stale = {
      ...room,
      state: { ...state, revision: state.revision + 1 },
      updatedAt: Date.now(),
    };
    expect(await memoryStore.saveIfRevision(stale, state.revision - 1)).toBe(
      "conflict",
    );
  });

  it("returns missing when room absent", async () => {
    const state = createInitialState();
    expect(
      await memoryStore.saveIfRevision(
        {
          id: "no-such-room",
          pinHash: "x",
          state,
          updatedAt: state.updatedAt,
        },
        1,
      ),
    ).toBe("missing");
  });
});
