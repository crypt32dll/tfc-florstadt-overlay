"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import { OverlayShell } from "@/components/overlay/OverlayShell";
import { getPublicControlPin } from "@/lib/auth/control-pin";
import { useRoomState } from "@/lib/hooks/useRoomState";
import type { MatchState } from "@/lib/match/types";

type Props = {
  roomId: string;
  initialState: MatchState;
  /** @deprecated PIN is club-wide via NEXT_PUBLIC_CONTROL_PIN; kept for API compat */
  pinHint?: string | null;
};

export function LabClient({ roomId, initialState, pinHint }: Props) {
  const { state, replaceState, refresh, connected } = useRoomState(
    roomId,
    initialState,
  );
  const [backdrop, setBackdrop] = useState<"checker" | "stream">("stream");
  const [qr, setQr] = useState<string>("");
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const controlPin = getPublicControlPin() ?? pinHint ?? null;

  const controlUrl = useMemo(() => {
    if (!origin) return "";
    const url = new URL(`${origin}/control/live`);
    if (controlPin) url.searchParams.set("pin", controlPin);
    return url.toString();
  }, [origin, controlPin]);

  const overlayUrl = useMemo(
    () => (origin ? `${origin}/overlay/live` : ""),
    [origin],
  );

  useEffect(() => {
    if (!controlUrl) return;
    let cancelled = false;
    void import("qrcode").then((QRCode) =>
      QRCode.toDataURL(controlUrl, {
        margin: 1,
        width: 220,
        color: { dark: "#111111", light: "#ffffff" },
      }).then((url) => {
        if (!cancelled) setQr(url);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [controlUrl]);

  const copyOverlayUrl = async () => {
    if (!overlayUrl) return;
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col text-white lg:flex-row">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 lg:p-8">
        <div
          className={`relative aspect-video w-full max-w-6xl overflow-hidden rounded-[var(--radius-panel)] border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${
            backdrop === "checker" ? "bg-checker" : "bg-[#0d121a]"
          }`}
        >
          {backdrop === "stream" && (
            <div
              className="absolute inset-0 opacity-45"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 40%, #0693e3 0%, transparent 45%), radial-gradient(circle at 70% 60%, #444 0%, #111 55%)",
              }}
            />
          )}
          <div className="absolute inset-0">
            <OverlayShell
              roomId={roomId}
              initialState={initialState}
              mode="lab"
              sync={{ state, replaceState, connected, refresh }}
            />
          </div>
        </div>
      </div>

      <aside className="glass-panel m-0 flex w-full flex-col gap-4 rounded-none border-x-0 border-b-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:m-4 lg:w-80 lg:rounded-[var(--radius-panel)] lg:border lg:pb-5">
        <div className="flex justify-center py-1">
          <BrandMark
            size={96}
            className="drop-shadow-[0_0_16px_rgba(6,147,227,0.35)]"
          />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-wide uppercase">
            Preview Lab
          </h1>
          <p className="mt-1 text-sm text-muted">
            Test ohne Twitch &amp; OBS. Handy-QR → Control.
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Raum</dt>
            <dd className="font-mono">{roomId}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">View</dt>
            <dd className="uppercase">{state.activeView}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Stand</dt>
            <dd className="font-display text-xl">
              {state.teamA.score}:{state.teamB.score}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Status</dt>
            <dd>
              {connected ? (
                <span className="badge-live">verbunden</span>
              ) : (
                <span className="text-amber-200">Sync …</span>
              )}
            </dd>
          </div>
        </dl>

        {!connected && (
          <output className="block rounded-[var(--radius-control)] border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Verbindung unterbrochen – Overlay zeigt „Sync …“.
          </output>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBackdrop("stream")}
            className={`btn flex-1 text-xs ${
              backdrop === "stream" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Stream
          </button>
          <button
            type="button"
            onClick={() => setBackdrop("checker")}
            className={`btn flex-1 text-xs ${
              backdrop === "checker" ? "btn-primary" : "btn-ghost"
            }`}
          >
            Transparenz
          </button>
        </div>

        {qr && (
          <div className="rounded-[var(--radius-control)] border border-white/15 bg-white p-3">
            {/* QR is a data URL from qrcode – next/image not applicable */}
            <img
              src={qr}
              alt="QR-Code zur Control-URL"
              width={220}
              height={220}
              className="mx-auto"
            />
            <p className="mt-2 text-center text-xs text-black/70">
              Scannen → /control/live
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void copyOverlayUrl()}
          disabled={!overlayUrl}
          className={`btn w-full text-sm ${
            copied ? "btn-primary" : "btn-ghost"
          }`}
        >
          {copied
            ? "Master-URL kopiert"
            : "OBS Master-URL kopieren (/overlay/live)"}
        </button>

        <section className="border-t border-white/10 pt-4 text-xs text-muted">
          <h2 className="font-display text-lg tracking-wide text-white uppercase">
            Checkliste
          </h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4">
            <li>QR mit dem Handy scannen</li>
            <li>Tore &amp; Screens im Control testen</li>
            <li>OBS: Browser-Quelle → /overlay/live</li>
          </ol>
        </section>
      </aside>
    </div>
  );
}
