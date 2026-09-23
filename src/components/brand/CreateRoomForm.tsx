"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createRoom, getStoreInfo } from "@/app/actions/rooms";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function CreateRoomForm() {
  const router = useRouter();
  const [teamA, setTeamA] = useState("Team Rot");
  const [teamB, setTeamB] = useState("Team Blau");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    roomId: string;
    pin: string;
  } | null>(null);
  const [storeMode, setStoreMode] = useState<"memory" | "supabase" | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void getStoreInfo().then((info) => setStoreMode(info.mode));
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createRoom({
        teamA,
        teamB,
        pin: pin || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCreated({ roomId: res.data.roomId, pin: res.data.pin });
      setStoreMode(res.data.storeMode);
      sessionStorage.setItem(`tfc-pin-${res.data.roomId}`, res.data.pin);
    });
  };

  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-sm border-2 border-black bg-white p-6">
        <h2 className="font-[family-name:var(--font-teko)] text-4xl uppercase">
          Raum bereit
        </h2>
        <p className="text-sm text-black/70">
          PIN nur jetzt notieren — er wird nicht wieder angezeigt.
        </p>
        <div className="space-y-2 border border-black/10 bg-[#f7f7f7] p-4 font-mono text-lg">
          <div>
            Raum: <strong>{created.roomId}</strong>
          </div>
          <div>
            PIN: <strong className="tracking-[0.3em]">{created.pin}</strong>
          </div>
          <div className="text-sm">Store: {storeMode}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push(`/lab/${created.roomId}`)}
            className="bg-[var(--brand-accent)] px-4 py-3 font-[family-name:var(--font-teko)] text-xl text-white uppercase"
          >
            Preview Lab öffnen
          </button>
          <button
            type="button"
            onClick={() => router.push(`/control/${created.roomId}`)}
            className="border-2 border-black px-4 py-3 font-[family-name:var(--font-teko)] text-xl uppercase"
          >
            Control öffnen
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-lg space-y-4 rounded-sm border-2 border-black bg-white p-6"
    >
      <BrandLogo
        className="mx-auto object-contain"
        width={240}
        height={100}
        priority
      />
      <h1 className="text-center font-[family-name:var(--font-teko)] text-4xl uppercase tracking-wide">
        Stream Overlay
      </h1>
      <p className="text-center text-sm text-black/65">
        Raum erstellen, im Lab testen, später in OBS einbinden. Kein
        Twitch-Account nötig zum Testen.
      </p>

      <label className="block text-sm">
        Team A
        <input
          value={teamA}
          onChange={(e) => setTeamA(e.target.value)}
          className="mt-1 w-full border-2 border-black px-3 py-2 outline-none focus:border-[var(--brand-accent)]"
        />
      </label>
      <label className="block text-sm">
        Team B
        <input
          value={teamB}
          onChange={(e) => setTeamB(e.target.value)}
          className="mt-1 w-full border-2 border-black px-3 py-2 outline-none focus:border-[var(--brand-accent)]"
        />
      </label>
      <label className="block text-sm">
        PIN (optional, sonst automatisch)
        <input
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          placeholder="4–6 Ziffern"
          className="mt-1 w-full border-2 border-black px-3 py-2 outline-none focus:border-[var(--brand-accent)]"
        />
      </label>

      {storeMode && (
        <p className="text-xs text-black/50">
          Aktueller Store: <strong>{storeMode}</strong>
          {storeMode === "memory"
            ? " (lokal, ohne Supabase — ideal zum ersten Test)"
            : " (Supabase)"}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[var(--brand-accent)] px-4 py-3 font-[family-name:var(--font-teko)] text-2xl text-white uppercase disabled:opacity-50"
      >
        {pending ? "Erstelle…" : "Raum erstellen"}
      </button>
    </form>
  );
}
