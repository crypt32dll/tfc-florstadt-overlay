"use client";

import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { completeTransition } from "@/app/actions/rooms";
import { useOverlaySfx } from "@/lib/hooks/useOverlaySfx";
import { useRoomState } from "@/lib/hooks/useRoomState";
import { clientLog } from "@/lib/logger.client";
import { applyMutation, normalizeState } from "@/lib/match/defaults";
import type { MatchState } from "@/lib/match/types";
import { preloadKickerTexture } from "@/lib/three/createLogoKicker";
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

type Props = {
  roomId: string;
  initialState: MatchState;
  /** Lab shows opaque stage chrome; OBS overlay is fully transparent outside panels */
  mode?: "overlay" | "lab";
  /** Optional: bubble connection status to Lab sidebar */
  onConnectionChange?: (connected: boolean) => void;
  onStateChange?: (state: MatchState) => void;
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function OverlayShell({
  roomId,
  initialState,
  mode = "overlay",
  onConnectionChange,
  onStateChange,
}: Props) {
  const { state, replaceState, connected } = useRoomState(roomId, initialState);
  useOverlaySfx(state);
  const completingRef = useRef(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    void preloadKickerTexture();
  }, []);

  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

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
        lastError = res.error;
        log.warn("completeTransition failed", { attempt, error: res.error });
        await sleep(250 * (attempt + 1));
      }

      log.error(
        "completeTransition giving up – applying local fallback",
        lastError,
      );
      replaceState(
        normalizeState(
          applyMutation(stateRef.current, { type: "transitionComplete" }),
        ),
      );
    } finally {
      completingRef.current = false;
    }
  }, [roomId, replaceState]);

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
        {(state.activeView === "startingSoon" ||
          (state.activeView === "transition" &&
            state.transitionTo === "startingSoon")) && (
          <StartingSoonScreen key="soon" state={state} />
        )}
        {(state.activeView === "live" ||
          (state.activeView === "transition" &&
            state.transitionTo === "live")) && (
          <Scorebug key="live" state={state} />
        )}
        {(state.activeView === "standings" ||
          (state.activeView === "transition" &&
            state.transitionTo === "standings")) && (
          <StandingsScreen key="standings" state={state} />
        )}
        {(state.activeView === "brb" ||
          (state.activeView === "transition" &&
            state.transitionTo === "brb")) && (
          <BrbScreen key="brb" state={state} />
        )}
        {(state.activeView === "ending" ||
          (state.activeView === "transition" &&
            state.transitionTo === "ending")) && (
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
