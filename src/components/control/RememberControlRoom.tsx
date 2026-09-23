"use client";

import { useEffect } from "react";
import { CONTROL_ROOM_STORAGE_KEY, isValidRoomId } from "@/lib/pwa/manifest";

/** Remembers the Control room so a home-screen PWA that still opens `/` can redirect. */
export function RememberControlRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    if (!isValidRoomId(roomId)) return;
    try {
      window.localStorage.setItem(CONTROL_ROOM_STORAGE_KEY, roomId);
    } catch {
      // private mode / quota
    }
  }, [roomId]);

  return null;
}
