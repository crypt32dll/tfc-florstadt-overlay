"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Client clock that ticks while `enabled`.
 * Snapshot is cached — inline `Date.now()` in getSnapshot causes React's
 * "getSnapshot should be cached" infinite loop.
 */
export function useNow(enabled: boolean, intervalMs = 250): number {
  const nowRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!enabled) return () => {};
      nowRef.current = Date.now();
      const id = window.setInterval(() => {
        nowRef.current = Date.now();
        onStoreChange();
      }, intervalMs);
      return () => window.clearInterval(id);
    },
    [enabled, intervalMs],
  );

  const getSnapshot = useCallback(() => nowRef.current, []);
  const getServerSnapshot = useCallback(() => 0, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
