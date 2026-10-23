"use client";

import { useEffect, useState } from "react";
import { getLiveOverlayRoom } from "@/app/actions/rooms";
import { OverlayShell } from "@/components/overlay/OverlayShell";
import type { MatchState } from "@/lib/match/types";

type Props = {
  initialRoomId: string;
  initialState: MatchState;
};

/**
 * Keeps /overlay/live on the latest created room.
 * Polls the pointer occasionally so OBS does not need a URL change.
 */
export function LiveOverlayClient({ initialRoomId, initialState }: Props) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [bootState, setBootState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const res = await getLiveOverlayRoom();
      if (cancelled || !res.ok) return;
      if (res.data.roomId !== roomId) {
        setRoomId(res.data.roomId);
        setBootState(res.data.state);
      }
    };
    const id = window.setInterval(() => {
      void tick();
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [roomId]);

  return (
    <OverlayShell
      key={roomId}
      roomId={roomId}
      initialState={bootState}
      mode="overlay"
    />
  );
}
