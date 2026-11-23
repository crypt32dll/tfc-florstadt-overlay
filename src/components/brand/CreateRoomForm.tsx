"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createRoom } from "@/app/actions/rooms";
import { BrandMark } from "@/components/brand/BrandMark";
import { KickerColorPicker } from "@/components/brand/KickerColorPicker";
import { LeagueTeamPicker } from "@/components/brand/LeagueTeamPicker";
import { actionErrorMessage } from "@/lib/action/result";
import { getPublicControlPin } from "@/lib/auth/control-pin";
import { createRoomSchema, type KickerColor } from "@/lib/match/schema";
import {
  findLeagueTeam,
  LEAGUE_TEAMS_FALLBACK,
} from "@/lib/tfvh/parse-league-teams";

const DEFAULT_HOME = "TFC Florstadt 1";
const DEFAULT_HOME_LOGO =
  findLeagueTeam(LEAGUE_TEAMS_FALLBACK, DEFAULT_HOME)?.logoUrl ?? null;

export function CreateRoomForm() {
  const [teamA, setTeamA] = useState(DEFAULT_HOME);
  const [teamB, setTeamB] = useState("");
  const [teamALogo, setTeamALogo] = useState<string | null>(DEFAULT_HOME_LOGO);
  const [teamBLogo, setTeamBLogo] = useState<string | null>(null);
  const [teamAColor, setTeamAColor] = useState<KickerColor>("blue");
  const [teamBColor, setTeamBColor] = useState<KickerColor>("red");
  const [error, setError] = useState<string | null>(null);
  const [teamBError, setTeamBError] = useState<string | undefined>();
  const [liveConfirm, setLiveConfirm] = useState(false);
  const [created, setCreated] = useState<{ roomId: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const teamBRef = useRef<HTMLInputElement>(null);
  const publicPin = getPublicControlPin();
  const pendingPayload = useRef<ReturnType<
    typeof createRoomSchema.parse
  > | null>(null);

  // Refresh home crest once if live scrape finds Florstadt and state is still default
  useEffect(() => {
    let cancelled = false;
    void import("@/app/actions/league").then(({ getLeagueTeams }) =>
      getLeagueTeams().then((res) => {
        if (cancelled || !res.ok) return;
        const hit = findLeagueTeam(res.data.teams, DEFAULT_HOME);
        if (hit?.logoUrl) {
          setTeamALogo((prev) => prev ?? hit.logoUrl);
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const submitCreate = (
    data: ReturnType<typeof createRoomSchema.parse>,
    retargetLive: boolean,
  ) => {
    startTransition(async () => {
      const res = await createRoom({ ...data, retargetLive });
      if (!res.ok) {
        if (res.code === "LIVE_ACTIVE") {
          pendingPayload.current = data;
          setLiveConfirm(true);
          setError(actionErrorMessage(res));
          return;
        }
        setError(actionErrorMessage(res));
        return;
      }
      setLiveConfirm(false);
      pendingPayload.current = null;
      setCreated({ roomId: res.data.roomId });
      sessionStorage.setItem(`tfc-pin-${res.data.roomId}`, res.data.pin);
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLiveConfirm(false);

    const parsed = createRoomSchema.safeParse({
      teamA: teamA.trim() || DEFAULT_HOME,
      teamB,
      teamAColor,
      teamBColor,
      teamALogo,
      teamBLogo,
      retargetLive: false,
    });

    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path[0] === "teamB");
      setTeamBError(issue?.message ?? "Gegner eingeben");
      teamBRef.current?.focus();
      return;
    }

    setTeamBError(undefined);
    submitCreate(parsed.data, false);
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
          Gegner aus der Verbandsliga Süd wählen oder manuell tippen.
        </p>
      </div>

      <div className="space-y-1.5">
        <LeagueTeamPicker
          label="Heim"
          name="teamA"
          value={teamA}
          logoUrl={teamALogo}
          onChange={({ name, logoUrl }) => {
            setTeamA(name);
            setTeamALogo(logoUrl);
          }}
          placeholder="TFC Florstadt 1"
        />
        <KickerColorPicker
          value={teamAColor}
          onChange={setTeamAColor}
          label="Farbe Heim"
        />
      </div>

      <div className="space-y-1.5">
        <LeagueTeamPicker
          label="Gegner"
          name="teamB"
          value={teamB}
          logoUrl={teamBLogo}
          onChange={({ name, logoUrl }) => {
            setTeamB(name);
            setTeamBLogo(logoUrl);
            if (teamBError) setTeamBError(undefined);
          }}
          excludeNameIncludes="Florstadt"
          error={teamBError}
          inputRef={teamBRef}
          placeholder="Team aus Liga oder Name…"
        />
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

      {liveConfirm && pendingPayload.current && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const data = pendingPayload.current;
            if (!data) return;
            submitCreate(data, true);
          }}
          className="btn btn-ghost w-full text-lg"
        >
          Trotzdem erstellen &amp; OBS umleiten
        </button>
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
