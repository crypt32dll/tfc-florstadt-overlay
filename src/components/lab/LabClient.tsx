"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { getRoomState } from "@/app/actions/rooms";
import { OverlayShell } from "@/components/overlay/OverlayShell";
import { BrandMark } from "@/components/brand/BrandMark";
import type { MatchState } from "@/lib/match/types";

type Props = {
  roomId: string;
  initialState: MatchState;
  pinHint?: string | null;
};

export function LabClient({
  roomId,
  initialState,
  pinHint,
}: Props) {
  const [meta, setMeta] = useState(initialState);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backdrop, setBackdrop] = useState<"checker" | "stream">("stream");
  const [qr, setQr] = useState<string>("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      const res = await getRoomState(roomId);
      if (!res.ok) {
        setError(res.error);
        setConnected(false);
        return;
      }
      setConnected(true);
      setError(null);
      setMeta(res.data.state);
    }, 500);
    return () => clearInterval(id);
  }, [roomId]);

  const controlUrl = useMemo(
    () => (origin ? `${origin}/control/${roomId}` : ""),
    [origin, roomId],
  );
  const overlayUrl = useMemo(
    () => (origin ? `${origin}/overlay/${roomId}` : ""),
    [origin, roomId],
  );

  useEffect(() => {
    if (!controlUrl) return;
    void QRCode.toDataURL(controlUrl, {
      margin: 1,
      width: 220,
      color: { dark: "#111111", light: "#ffffff" },
    }).then(setQr);
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
            />
          </div>
        </div>
      </div>

      <aside className="glass-panel m-0 flex w-full flex-col gap-4 rounded-none border-x-0 border-b-0 p-5 lg:m-4 lg:w-80 lg:rounded-[var(--radius-panel)] lg:border">
        <div className="flex justify-center py-1">
          <BrandMark size={96} className="drop-shadow-[0_0_16px_rgba(6,147,227,0.35)]" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-wide uppercase">
            Preview Lab
          </h1>
          <p className="mt-1 text-sm text-muted">
            Test ohne Twitch &amp; OBS. Handy scannen → Control.
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Raum</dt>
            <dd className="font-mono">{roomId}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">View</dt>
            <dd className="uppercase">{meta.activeView}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Stand</dt>
            <dd className="font-display text-xl">
              {meta.teamA.score}:{meta.teamB.score}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Status</dt>
            <dd>
              {connected ? (
                <span className="badge-live">verbunden</span>
              ) : (
                "…"
              )}
            </dd>
          </div>
          {pinHint && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted">PIN</dt>
              <dd className="font-mono tracking-widest">{pinHint}</dd>
            </div>
          )}
        </dl>

        {error && (
          <p className="rounded-[var(--radius-control)] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Control" className="mx-auto" />
            <p className="mt-2 text-center text-xs text-black/70">
              Control auf dem Handy
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
          {copied ? "OBS-Link kopiert" : "OBS Overlay-Link kopieren"}
        </button>
      </aside>
    </div>
  );
}
