"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRoom } from "@/app/actions/rooms";
import { BrandMark } from "@/components/brand/BrandMark";
import { createRoomSchema } from "@/lib/match/schema";

type FieldErrors = {
  teamA?: string;
  teamB?: string;
  pin?: string;
};

export function CreateRoomForm() {
  const router = useRouter();
  const [teamA, setTeamA] = useState("TFC Florstadt");
  const [teamB, setTeamB] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState<{
    roomId: string;
    pin: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = createRoomSchema.safeParse({
      teamA,
      teamB,
      pin: pin || undefined,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "teamA" || key === "teamB" || key === "pin") {
          if (!next[key]) next[key] = issue.message;
        }
      }
      setFieldErrors(next);
      return;
    }

    setFieldErrors({});
    startTransition(async () => {
      const res = await createRoom(parsed.data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCreated({ roomId: res.data.roomId, pin: res.data.pin });
      sessionStorage.setItem(`tfc-pin-${res.data.roomId}`, res.data.pin);
    });
  };

  if (created) {
    return (
      <div className="glass-panel-strong mx-auto w-full max-w-lg space-y-6 p-5 sm:p-6">
        <p className="badge-live w-fit">Bereit</p>
        <h2 className="font-display text-4xl tracking-wide text-white uppercase sm:text-5xl">
          Raum bereit
        </h2>
        <p className="text-sm text-muted">
          PIN nur jetzt notieren — er wird nicht wieder angezeigt.
        </p>
        <div className="space-y-3 rounded-[var(--radius-control)] border border-white/10 bg-black/35 p-4 font-mono text-lg">
          <div className="flex justify-between gap-3 text-sm sm:text-base">
            <span className="text-muted">Raum</span>
            <strong className="text-white">{created.roomId}</strong>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between gap-3 text-sm sm:text-base">
            <span className="text-muted">PIN</span>
            <strong className="tracking-[0.35em] text-[var(--brand-accent)]">
              {created.pin}
            </strong>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push(`/lab/${created.roomId}`)}
            className="btn btn-primary text-xl"
          >
            Preview Lab
          </button>
          <button
            type="button"
            onClick={() => router.push(`/control/${created.roomId}`)}
            className="btn btn-ghost text-xl"
          >
            Control
          </button>
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
          Raum erstellen, im Lab testen, später in OBS einbinden.
        </p>
      </div>

      <label className="block space-y-1.5 text-sm text-muted">
        Team A
        <input
          value={teamA}
          onChange={(e) => {
            setTeamA(e.target.value);
            if (fieldErrors.teamA) {
              setFieldErrors((prev) => ({ ...prev, teamA: undefined }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.teamA)}
          aria-describedby={fieldErrors.teamA ? "teamA-error" : undefined}
          className={`glass-input text-base text-white ${
            fieldErrors.teamA ? "border-red-400/60" : ""
          }`}
        />
        {fieldErrors.teamA && (
          <p id="teamA-error" role="alert" className="text-xs text-red-300">
            {fieldErrors.teamA}
          </p>
        )}
      </label>
      <label className="block space-y-1.5 text-sm text-muted">
        Team B
        <input
          value={teamB}
          onChange={(e) => {
            setTeamB(e.target.value);
            if (fieldErrors.teamB) {
              setFieldErrors((prev) => ({ ...prev, teamB: undefined }));
            }
          }}
          placeholder="Gegner"
          aria-invalid={Boolean(fieldErrors.teamB)}
          aria-describedby={fieldErrors.teamB ? "teamB-error" : undefined}
          className={`glass-input text-base text-white ${
            fieldErrors.teamB ? "border-red-400/60" : ""
          }`}
        />
        {fieldErrors.teamB && (
          <p id="teamB-error" role="alert" className="text-xs text-red-300">
            {fieldErrors.teamB}
          </p>
        )}
      </label>
      <label className="block space-y-1.5 text-sm text-muted">
        PIN (optional, sonst automatisch)
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (fieldErrors.pin) {
              setFieldErrors((prev) => ({ ...prev, pin: undefined }));
            }
          }}
          inputMode="numeric"
          placeholder="4–6 Ziffern"
          aria-invalid={Boolean(fieldErrors.pin)}
          aria-describedby={fieldErrors.pin ? "pin-error" : undefined}
          className={`glass-input text-base tracking-widest text-white ${
            fieldErrors.pin ? "border-red-400/60" : ""
          }`}
        />
        {fieldErrors.pin && (
          <p id="pin-error" role="alert" className="text-xs text-red-300">
            {fieldErrors.pin}
          </p>
        )}
      </label>

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
        {pending ? "Erstelle…" : "Raum erstellen"}
      </button>
    </form>
  );
}
