"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isStandaloneDisplay } from "@/lib/pwa/manifest";

/**
 * Standalone launches that still hit `/` (old site manifest) go to the Control hub.
 */
export function PwaHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isStandaloneDisplay()) return;
    router.replace("/control");
  }, [router]);

  return null;
}
