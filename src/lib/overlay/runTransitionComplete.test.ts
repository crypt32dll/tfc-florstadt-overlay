import { beforeEach, describe, expect, it, vi } from "vitest";

const completeTransition = vi.fn();

vi.mock("@/app/actions/rooms", () => ({
  completeTransition: (...args: unknown[]) => completeTransition(...args),
}));

import { runTransitionComplete } from "@/lib/overlay/runTransitionComplete";

describe("runTransitionComplete", () => {
  beforeEach(() => {
    completeTransition.mockReset();
    vi.useFakeTimers();
  });

  it("applies successful transition state", async () => {
    const replaceState = vi.fn();
    const refresh = vi.fn();
    completeTransition.mockResolvedValue({
      ok: true,
      data: { state: { revision: 5 } },
    });
    const done = runTransitionComplete("room1", { replaceState, refresh });
    await vi.runAllTimersAsync();
    await done;
    expect(replaceState).toHaveBeenCalledWith({ revision: 5 });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("retries then refreshes after repeated failures", async () => {
    const replaceState = vi.fn();
    const refresh = vi.fn().mockResolvedValue(null);
    completeTransition.mockResolvedValue({ ok: false, code: "CONFLICT" });
    const done = runTransitionComplete("room1", { replaceState, refresh });
    await vi.runAllTimersAsync();
    await done;
    expect(completeTransition).toHaveBeenCalledTimes(3);
    expect(refresh).toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
