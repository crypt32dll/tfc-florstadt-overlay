import { completeTransition } from "@/app/actions/rooms";
import { clientLog } from "@/lib/logger.client";
import type { MatchState } from "@/lib/match/types";

const log = clientLog("transition-complete");

export type TransitionCompletePorts = {
  replaceState: (next: MatchState) => void;
  refresh: () => Promise<MatchState | null>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Shared adapter for finishing a logo sting: Overlay and Control both write
 * through completeTransition (no control session, no revision CAS).
 * Retries then refreshes from the store — MatchState stays server-authoritative.
 */
export async function runTransitionComplete(
  roomId: string,
  ports: TransitionCompletePorts,
): Promise<boolean> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await completeTransition(roomId);
    if (res.ok) {
      ports.replaceState(res.data.state);
      return true;
    }
    lastError = res.code;
    log.warn("completeTransition failed", { attempt, code: res.code });
    await sleep(250 * (attempt + 1));
  }

  log.error("completeTransition giving up – refreshing from store", lastError);
  await ports.refresh();
  return false;
}
