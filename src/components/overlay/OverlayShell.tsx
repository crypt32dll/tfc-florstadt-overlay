"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { completeTransition } from "@/app/actions/rooms";
import { useOverlaySfx } from "@/lib/hooks/useOverlaySfx";
import { useRoomState } from "@/lib/hooks/useRoomState";
import { clientLog } from "@/lib/logger.client";
import type { MatchState } from "@/lib/match/types";
import { isShowingView } from "@/lib/match/views";
import { BrbScreen } from "./BrbScreen";
import { EndingScreen } from "./EndingScreen";
import { Scorebug } from "./Scorebug";
import { StandingsScreen } from "./StandingsScreen";
import { StartingSoonScreen } from "./StartingSoonScreen";

const log = clientLog("overlay-shell");

const KickerTransition = dynamic(
  () => import("./KickerTransition").then((m) => m.KickerTransition),
  { ssr: false },
);

export type RoomSync = {
  state: MatchState;
  replaceState: (next: MatchState) => void;
  connected: boolean;
  refresh: () => Promise<MatchState | null>;
};

type Props = {
  roomId: string;
  initialState: MatchState;
  /** Lab shows opaque stage chrome; OBS overlay is fully transparent outside panels */
  mode?: "overlay" | "lab";
  /**
   * Parent-owned Room sync (Lab). When set, the shell does not open a second
   * realtime/poll subscription.
   */
  sync?: RoomSync;
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function OverlayShell({
  roomId,
  initialState,
  mode = "overlay",
  sync,
}: Props) {
  const owned = useRoomState(roomId, initialState, { enabled: !sync });
  const state = sync?.state ?? owned.state;
  const replaceState = sync?.replaceState ?? owned.replaceState;
  const connected = sync?.connected ?? owned.connected;
  const refresh = sync?.refresh ?? owned.refresh;

  useOverlaySfx(state);
  const completingRef = useRef(false);

  useEffect(() => {
    // Dynamic import keeps three.js out of the initial overlay chunk
    // (bundle-dynamic-imports / bundle-conditional).
    void import("@/lib/three/createLogoKicker").then((m) =>
      m.preloadKickerTexture(),
    );
  }, []);

  const onTransitionComplete = useCallback(async () => {
    if (completingRef.current) return;
    completingRef.current = true;
    try {
      let lastError: string | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const res = await completeTransition(roomId);
        if (res.ok) {
          replaceState(res.data.state);
          return;
        }
        lastError = res.code;
        log.warn("completeTransition failed", { attempt, code: res.code });
        await sleep(250 * (attempt + 1));
      }

      // Server remains MatchState authority — refresh only, no local applyMutation.
      log.error(
        "completeTransition giving up – refreshing from store",
        lastError,
      );
      await refresh();
    } finally {
      completingRef.current = false;
    }
  }, [roomId, replaceState, refresh]);

  return (
    <div
      className={
        mode === "lab"
          ? "relative h-full w-full overflow-hidden bg-transparent"
          : "relative h-[1080px] w-[1920px] overflow-hidden bg-transparent"
      }
      style={mode === "overlay" ? { width: 1920, height: 1080 } : undefined}
    >
      <AnimatePresence mode="sync">
        {isShowingView(state, "startingSoon") && (
          <StartingSoonScreen key="soon" state={state} />
        )}
        {isShowingView(state, "live") && <Scorebug key="live" state={state} />}
        {isShowingView(state, "standings") && (
          <StandingsScreen key="standings" state={state} />
        )}
        {isShowingView(state, "brb") && <BrbScreen key="brb" state={state} />}
        {isShowingView(state, "ending") && (
          <EndingScreen key="ending" state={state} />
        )}
      </AnimatePresence>

      {state.activeView === "transition" && (
        <KickerTransition
          key={`kick-${state.revision}-${state.transitionTo}`}
          onComplete={onTransitionComplete}
        />
      )}

      {!connected && (
        <div
          className={`pointer-events-none absolute z-50 rounded-md border border-amber-400/40 bg-black/70 px-2.5 py-1 text-[0.65rem] tracking-wide text-amber-100 uppercase ${
            mode === "lab" ? "bottom-3 left-3" : "bottom-4 left-4 opacity-70"
          }`}
        >
          <output>Sync …</output>
        </div>
      )}
    </div>
  );
}
