"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { createRoom } from "@/app/actions/rooms";
import { BrandMark } from "@/components/brand/BrandMark";
import { KickerColorPicker } from "@/components/brand/KickerColorPicker";
import { actionErrorMessage } from "@/lib/action/result";
import { getPublicControlPin } from "@/lib/auth/control-pin";
import { createRoomSchema, type KickerColor } from "@/lib/match/schema";

export function CreateRoomForm() {
  const [teamA, setTeamA] = useState("TFC Florstadt");
  const [teamB, setTeamB] = useState("");
  const [teamAColor, setTeamAColor] = useState<KickerColor>("blue");
  const [teamBColor, setTeamBColor] = useState<KickerColor>("red");
  const [error, setError] = useState<string | null>(null);
  const [teamBError, setTeamBError] = useState<string | undefined>();
  const [created, setCreated] = useState<{ roomId: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const teamBRef = useRef<HTMLInputElement>(null);
  const publicPin = getPublicControlPin();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = createRoomSchema.safeParse({
      teamA: teamA.trim() || "TFC Florstadt",
      teamB,
      teamAColor,
      teamBColor,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path[0] === "teamB");
      setTeamBError(issue?.message ?? "Gegner eingeben");
      teamBRef.current?.focus();
      return;
    }

    setTeamBError(undefined);
    startTransition(async () => {
      const res = await createRoom(parsed.data);
      if (!res.ok) {
        setError(actionErrorMessage(res));
        return;
      }
      setCreated({ roomId: res.data.roomId });
      sessionStorage.setItem(`tfc-pin-${res.data.roomId}`, res.data.pin);
    });
  };

  if (created) {
    const controlHref = publicPin
      ? `/control/live?pin=${encodeURIComponent(publicPin)}`
      : `/control/live`;
    return (
      <div className="glass-panel-strong mx-auto w-full max-w-lg space-y-6 p-5 sm:p-6">
        <p className="badge-live w-fit">Bereit</p>
        <h2 className="font-display text-4xl tracking-wide text-white uppercase sm:text-5xl">
          Raum bereit
        </h2>
        <p className="text-sm text-muted">
          Control immer unter{" "}
          <code className="text-[var(--brand-accent)]">/control/live</code> —
          fester Club-PIN, Lab-QR schaltet frei.
        </p>
        <div className="rounded-[var(--radius-control)] border border-white/10 bg-black/35 p-4 font-mono text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">Raum</span>
            <strong className="text-white" translate="no">
              {created.roomId}
            </strong>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href={`/lab/${created.roomId}`}
            className="btn btn-primary text-xl"
          >
            Preview Lab
          </Link>
          <Link href={controlHref} className="btn btn-ghost text-xl">
            Control
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel-strong mx-auto w-full max-w-lg space-y-4 p-5 sm:space-y-5 sm:p-6"
      noValidate
    >
      <BrandMark
        size={96}
        priority
        className="mx-auto size-16 drop-shadow-[0_8px_24px_rgba(6,147,227,0.45)] sm:size-24"
      />
      <div className="space-y-1.5 text-center sm:space-y-2">
        <p className="text-xs tracking-[0.2em] text-[var(--brand-accent)] uppercase">
          Tischfußball Club Florstadt
        </p>
        <h1 className="font-display text-3xl tracking-wide text-white uppercase sm:text-4xl">
          Stream Overlay
        </h1>
        <p className="text-sm text-muted">
          Gegner eintragen — Heim ist TFC Florstadt, wenn leer. PIN ist clubweit
          fest.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block space-y-1.5 text-sm text-muted">
          Heim
          <input
            name="teamA"
            autoComplete="off"
            value={teamA}
            onChange={(e) => setTeamA(e.target.value)}
            placeholder="TFC Florstadt"
            className="glass-input text-base text-white"
          />
        </label>
        <KickerColorPicker
          value={teamAColor}
          onChange={setTeamAColor}
          label="Farbe Heim"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block space-y-1.5 text-sm text-muted">
          Gegner
          <input
            ref={teamBRef}
            name="teamB"
            autoComplete="off"
            value={teamB}
            onChange={(e) => {
              setTeamB(e.target.value);
              if (teamBError) setTeamBError(undefined);
            }}
            placeholder="Teamname…"
            aria-invalid={Boolean(teamBError)}
            aria-describedby={teamBError ? "teamB-error" : undefined}
            className={`glass-input text-base text-white ${
              teamBError ? "border-red-400/60" : ""
            }`}
          />
          {teamBError && (
            <p id="teamB-error" role="alert" className="text-xs text-red-300">
              {teamBError}
            </p>
          )}
        </label>
        <KickerColorPicker
          value={teamBColor}
          onChange={setTeamBColor}
          label="Farbe Gegner"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full text-2xl"
      >
        {pending ? "Erstelle…" : "Match starten"}
      </button>
    </form>
  );
}
