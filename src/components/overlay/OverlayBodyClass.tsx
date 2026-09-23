"use client";

import { useEffect } from "react";

/** Makes document background transparent for OBS Browser Source. */
export function OverlayBodyClass() {
  useEffect(() => {
    document.documentElement.classList.add("overlay-root");
    document.body.classList.add("overlay-root");
    return () => {
      document.documentElement.classList.remove("overlay-root");
      document.body.classList.remove("overlay-root");
    };
  }, []);
  return null;
}
