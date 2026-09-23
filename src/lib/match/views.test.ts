import { describe, expect, it } from "vitest";
import { createInitialState } from "@/lib/match/engine";
import { displayView, isShowingView } from "@/lib/match/views";

describe("displayView", () => {
  it("returns active destination when not transitioning", () => {
    const state = createInitialState();
    expect(displayView(state)).toBe("startingSoon");
    expect(isShowingView(state, "startingSoon")).toBe(true);
    expect(isShowingView(state, "live")).toBe(false);
  });

  it("returns transitionTo during sting", () => {
    const state = {
      ...createInitialState(),
      activeView: "transition" as const,
      transitionTo: "live" as const,
    };
    expect(displayView(state)).toBe("live");
    expect(isShowingView(state, "live")).toBe(true);
    expect(isShowingView(state, "startingSoon")).toBe(false);
  });
});
