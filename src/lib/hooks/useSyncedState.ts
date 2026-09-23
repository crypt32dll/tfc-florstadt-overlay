"use client";

import { useState } from "react";

/**
 * Local draft state that resets when the external source value changes.
 * Prefer this over syncing in useEffect (avoids cascading renders).
 */
export function useSyncedState<T>(external: T) {
  const [value, setValue] = useState(external);
  const [prev, setPrev] = useState(external);
  if (external !== prev) {
    setPrev(external);
    setValue(external);
  }
  return [value, setValue] as const;
}
