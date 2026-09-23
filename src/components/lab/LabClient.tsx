"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { getRoomState } from "@/app/actions/rooms";
import { OverlayShell } from "@/components/overlay/OverlayShell";
import { BrandLogo } from "@/components/brand/BrandLogo";
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

  return (
    <div className="flex min-h-dvh flex-col bg-[#111] text-white lg:flex-row">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 lg:p-8">
        <div
          className={`relative aspect-video w-full max-w-6xl overflow-hidden border border-white/20 shadow-2xl ${
            backdrop === "checker" ? "bg-checker" : "bg-[#1a1a1a]"
          }`}
        >
          {backdrop === "stream" && (
            <div
              className="absolute inset-0 opacity-40"
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

      <aside className="flex w-full flex-col gap-4 border-t border-white/10 bg-[#0a0a0a] p-5 lg:w-80 lg:border-t-0 lg:border-l">
        <BrandLogo width={160} height={67} className="object-contain" />
        <div>
          <h1 className="font-[family-name:var(--font-teko)] text-3xl uppercase tracking-wide">
            Preview Lab
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Test ohne Twitch &amp; OBS. Handy scannen → Control.
          </p>
        </div>

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-white/50">Raum</dt>
            <dd className="font-mono">{roomId}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/50">View</dt>
            <dd className="uppercase">{meta.activeView}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/50">Stand</dt>
            <dd className="font-[family-name:var(--font-teko)] text-xl">
              {meta.teamA.score}:{meta.teamB.score}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-white/50">Status</dt>
            <dd>{connected ? "verbunden" : "…"}</dd>
          </div>
          {pinHint && (
            <div className="flex justify-between gap-2">
              <dt className="text-white/50">PIN</dt>
              <dd className="font-mono tracking-widest">{pinHint}</dd>
            </div>
          )}
        </dl>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBackdrop("stream")}
            className={`flex-1 border px-2 py-2 text-xs uppercase ${
              backdrop === "stream"
                ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]"
                : "border-white/30"
            }`}
          >
            Stream
          </button>
          <button
            type="button"
            onClick={() => setBackdrop("checker")}
            className={`flex-1 border px-2 py-2 text-xs uppercase ${
              backdrop === "checker"
                ? "border-[var(--brand-accent)] bg-[var(--brand-accent)]"
                : "border-white/30"
            }`}
          >
            Transparenz
          </button>
        </div>

        {qr && (
          <div className="rounded-sm bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR Control" className="mx-auto" />
            <p className="mt-2 text-center text-xs text-black/70">
              Control auf dem Handy
            </p>
          </div>
        )}

        <div className="space-y-2 text-xs break-all text-white/60">
          <div>
            <div className="text-white/40">Control</div>
            <a className="text-[var(--brand-accent)]" href={controlUrl}>
              {controlUrl}
            </a>
          </div>
          <div>
            <div className="text-white/40">OBS Overlay</div>
            <a className="text-[var(--brand-accent)]" href={overlayUrl}>
              {overlayUrl}
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
