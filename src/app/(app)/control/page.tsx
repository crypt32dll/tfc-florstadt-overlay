"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { isStandaloneDisplay, readLastControlRoom } from "@/lib/pwa/manifest";

/**
 * PWA start_url hub: send operators to the last Control room, or wait for a QR deep link.
 */
export default function ControlHubPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "empty">("checking");

  useEffect(() => {
    const last = readLastControlRoom();
    if (last) {
      router.replace(`/control/${last}`);
      return;
    }
    setStatus("empty");
  }, [router]);

  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-6 px-5 py-10">
      <PwaInstallPrompt />
      <BrandMark size={96} className="drop-shadow-lg" />
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="font-display text-4xl tracking-wide text-white uppercase">
          Control
        </h1>
        {status === "checking" ? (
          <p className="text-sm text-muted">Raum wird geladen…</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {isStandaloneDisplay()
                ? "Kein Raum gespeichert. Scanne den QR-Code im Lab – die App öffnet dann den neuen Raum."
                : "Scanne den QR-Code im Preview Lab, um einen Raum zu öffnen. Optional als App installieren (ein Icon für alle Räume)."}
            </p>
            <p className="text-xs text-white/45">
              Tipp: QR zeigt immer auf{" "}
              <code className="text-[var(--brand-accent)]">/control/…</code> –
              dieselbe PWA wechselt den Raum.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
