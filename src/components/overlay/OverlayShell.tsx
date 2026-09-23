"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useCallback } from "react";
import { completeTransition } from "@/app/actions/rooms";
import { useRoomState } from "@/lib/hooks/useRoomState";
import type { MatchState } from "@/lib/match/types";
import { Scorebug } from "./Scorebug";
import { StartingSoonScreen } from "./StartingSoonScreen";
import { StandingsScreen } from "./StandingsScreen";

const KickerTransition = dynamic(
  () =>
    import("./KickerTransition").then((m) => m.KickerTransition),
  { ssr: false },
);

type Props = {
  roomId: string;
  initialState: MatchState;
  /** Lab shows opaque stage chrome; OBS overlay is fully transparent outside panels */
  mode?: "overlay" | "lab";
};

export function OverlayShell({
  roomId,
  initialState,
  mode = "overlay",
}: Props) {
  const { state, setState } = useRoomState(roomId, initialState);

  const onTransitionComplete = useCallback(async () => {
    const res = await completeTransition(roomId);
    if (res.ok) {
      setState(res.data.state);
    }
  }, [roomId, setState]);

  return (
    <div
      className={
        mode === "lab"
          ? "relative h-full w-full overflow-hidden bg-transparent"
          : "relative h-[1080px] w-[1920px] overflow-hidden bg-transparent"
      }
      style={mode === "overlay" ? { width: 1920, height: 1080 } : undefined}
    >
      <AnimatePresence mode="wait">
        {state.activeView === "startingSoon" && (
          <StartingSoonScreen key="soon" state={state} />
        )}
        {state.activeView === "live" && (
          <Scorebug key="live" state={state} />
        )}
        {state.activeView === "standings" && (
          <StandingsScreen key="standings" state={state} />
        )}
        {state.activeView === "transition" && state.transitionTo === "live" && (
          <Scorebug key="live-under" state={state} />
        )}
        {state.activeView === "transition" &&
          state.transitionTo === "standings" && (
            <StandingsScreen key="standings-under" state={state} />
          )}
        {state.activeView === "transition" &&
          state.transitionTo === "startingSoon" && (
            <StartingSoonScreen key="soon-under" state={state} />
          )}
      </AnimatePresence>

      {state.activeView === "transition" && (
        <KickerTransition
          key={`kick-${state.revision}-${state.transitionTo}`}
          onComplete={onTransitionComplete}
        />
      )}
    </div>
  );
}
