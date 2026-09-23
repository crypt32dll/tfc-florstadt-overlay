"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CONTROL_ROOM_STORAGE_KEY, isValidRoomId } from "@/lib/pwa/manifest";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

/**
 * If the installed PWA still has start_url `/`, bounce to the last Control room
 * (set when the operator opened Control via QR).
 */
export function PwaHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandaloneDisplay()) return;
    try {
      const roomId = window.localStorage.getItem(CONTROL_ROOM_STORAGE_KEY);
      if (!roomId || !isValidRoomId(roomId)) return;
      router.replace(`/control/${roomId}`);
    } catch {
      // ignore
    }
  }, [router]);

  return null;
}
