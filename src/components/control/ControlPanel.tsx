"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkControlAuth,
  getRoomState,
  mutateRoom,
  verifyRoomPin,
} from "@/app/actions/rooms";
import { BrandMark } from "@/components/brand/BrandMark";
import { formatTimer, getElapsedMs } from "@/lib/match/defaults";
import { GAME_LINEUP } from "@/lib/match/rules";
import { useRoomState } from "@/lib/hooks/useRoomState";
import { clientLog } from "@/lib/logger.client";
import type { ActiveView, MatchState } from "@/lib/match/types";

const log = clientLog("control");

type Props = {
  roomId: string;
  initialState: MatchState;
};

export function ControlPanel({ roomId, initialState }: Props) {
  const { state, replaceState, refresh, connected, error } =
    useRoomState(roomId, initialState);
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [timerMounted, setTimerMounted] = useState(false);
  const [now, setNow] = useState(0);
  const [startingDraft, setStartingDraft] = useState(
    initialState.startingMessage ?? "",
  );
  const [brbDraft, setBrbDraft] = useState(initialState.brbMessage ?? "");
  const [endingDraft, setEndingDraft] = useState(
    initialState.endingMessage ?? "",
  );
  const [volumeDraft, setVolumeDraft] = useState(
    Math.round((initialState.sfxVolume ?? 0.7) * 100),
  );
  const pinSubmitting = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    void checkControlAuth(roomId).then((res) => {
      if (res.ok) setAuthorized(res.data.authorized);
    });
  }, [roomId]);

  useEffect(() => {
    setStartingDraft(state.startingMessage ?? "");
  }, [state.startingMessage]);

  useEffect(() => {
    setBrbDraft(state.brbMessage ?? "");
  }, [state.brbMessage]);

  useEffect(() => {
    setEndingDraft(state.endingMessage ?? "");
  }, [state.endingMessage]);

  useEffect(() => {
    setVolumeDraft(Math.round((state.sfxVolume ?? 0.7) * 100));
  }, [state.sfxVolume]);

  useEffect(() => {
    setTimerMounted(true);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!timerMounted || !state.timer.running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [
    timerMounted,
    state.timer.running,
    state.timer.startedAt,
    state.timer.elapsedMs,
  ]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const displayedElapsed =
    !timerMounted || !state.timer.running
      ? state.timer.elapsedMs
      : getElapsedMs(state, now);

  const showToast = (msg: string) => setToast(msg);

  const run = (
    mutation: Parameters<typeof mutateRoom>[1],
    opts?: { skipRevisionCheck?: boolean },
  ) => {
    startTransition(async () => {
      try {
        const res = await mutateRoom(roomId, mutation, {
          expectedRevision: opts?.skipRevisionCheck
            ? undefined
            : stateRef.current.revision,
        });
        if (!res.ok) {
          if (res.error === "UNAUTHORIZED") {
            setAuthorized(false);
            setAuthError("Session abgelaufen – bitte PIN erneut eingeben.");
            log.warn("session expired", roomId);
          } else if (res.error === "CONFLICT") {
            showToast("Zustand aktualisiert – bitte erneut tippen.");
            log.warn("revision conflict", roomId);
            const fresh = await getRoomState(roomId);
            if (fresh.ok) {
              replaceState(fresh.data.state);
            } else {
              await refresh();
            }
          } else {
            setAuthError(res.error);
            showToast(res.error);
            log.warn("mutation rejected", res.error);
          }
          return;
        }
        setAuthError(null);
        replaceState(res.data.state);
      } catch (err) {
        log.error("mutation network error", err);
        const msg =
          err instanceof Error
            ? err.message
            : "Netzwerkfehler – bitte erneut versuchen.";
        setAuthError(msg);
        showToast(msg);
      }
    });
  };

  const confirmRun = (message: string, mutation: Parameters<typeof mutateRoom>[1]) => {
    if (typeof window !== "undefined" && !window.confirm(message)) return;
    run(mutation);
  };

  const onPinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pinSubmitting.current || pinLoading) return;

    const cleanPin = pin.replace(/\D/g, "");
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setAuthError("PIN muss 4–6 Ziffern haben.");
      return;
    }

    pinSubmitting.current = true;
    setPinLoading(true);
    setAuthError(null);
    try {
      const res = await verifyRoomPin({ roomId, pin: cleanPin });
      if (!res.ok) {
        setAuthError(res.error || "PIN-Prüfung fehlgeschlagen");
        log.warn("PIN failed", res.error);
        return;
      }
      setAuthorized(true);
      setPin("");
    } catch (err) {
      log.error("PIN network error", err);
      setAuthError(
        err instanceof Error
          ? err.message
          : "Verbindung fehlgeschlagen. Bitte WLAN/URL prüfen und erneut versuchen.",
      );
    } finally {
      pinSubmitting.current = false;
      setPinLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="app-shell flex min-h-dvh flex-col px-5 pt-10 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 pb-36">
          <div className="glass-panel-strong space-y-5 p-6">
            <BrandMark size={96} priority className="mx-auto drop-shadow-lg" />
            <div className="space-y-1 text-center">
              <h1 className="font-display text-4xl tracking-wide text-white uppercase">
                Control
              </h1>
              <p className="text-sm text-muted">
                PIN eingeben, um Tore und Screens zu steuern.
              </p>
            </div>
            <form
              id="pin-form"
              onSubmit={(e) => {
                void onPinSubmit(e);
              }}
            >
              <input
                name="pin"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setAuthError(null);
                }}
                placeholder="PIN"
                enterKeyHint="go"
                autoComplete="one-time-code"
                className="glass-input py-4 text-center text-2xl tracking-[0.4em] text-white"
              />
            </form>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/55 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mx-auto max-w-md space-y-2">
            {authError && (
              <p
                role="alert"
                className="rounded-[var(--radius-control)] border border-red-400/30 bg-red-500/15 px-3 py-2 text-center text-sm font-medium text-red-200"
              >
                {authError}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                void onPinSubmit();
              }}
              disabled={pinLoading}
              className="btn btn-primary relative z-50 w-full text-2xl"
            >
              {pinLoading ? "Prüfe…" : "Freischalten"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <BrandMark size={48} />
        <div className="text-right text-xs">
          <div className={connected ? "badge-live" : "text-amber-300"}>
            {connected ? "Live" : "Keine Verbindung…"}
          </div>
          <div className="mt-1 font-mono text-muted">{roomId}</div>
        </div>
      </div>

      {!connected && (
        <p
          role="status"
          className="rounded-[var(--radius-control)] border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-100"
        >
          Verbindung unterbrochen – Änderungen ggf. verzögert. WLAN prüfen.
        </p>
      )}

      {(toast || error || authError) && (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200"
        >
          {toast ?? error ?? authError}
        </p>
      )}

      <div className="glass-panel-strong px-4 py-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs tracking-wide text-muted uppercase">
          <span>
            Spiel {(state.lineupIndex ?? 0) + 1}/{GAME_LINEUP.length} ·{" "}
            {(state.gameType ?? "doppel") === "doppel" ? "Doppel" : "Einzel"}
          </span>
          <span className="text-[var(--brand-accent)]">
            Sätze {state.sets?.a ?? 0}:{state.sets?.b ?? 0}
          </span>
          <span>
            Gesamt {state.sessionWins.a}:{state.sessionWins.b}
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamNameEditor
            name={state.teamA.name}
            onSave={(name) => run({ type: "setName", side: "a", name })}
            align="right"
          />
          <div className="text-center">
            <div className="font-display text-5xl tabular-nums text-white">
              {state.teamA.score}
              <span className="text-[var(--brand-accent)]">:</span>
              {state.teamB.score}
            </div>
          </div>
          <TeamNameEditor
            name={state.teamB.name}
            onSave={(name) => run({ type: "setName", side: "b", name })}
            align="left"
          />
        </div>
        <div className="mt-1 text-center font-display text-2xl text-[var(--brand-accent)] tabular-nums">
          {formatTimer(displayedElapsed)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ type: "setMatchFormat", format: "bestOf3" })}
          className={`btn text-base ${
            (state.matchFormat ?? "bestOf3") === "bestOf3"
              ? "btn-primary"
              : "btn-ghost"
          }`}
        >
          Best of 3
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ type: "setMatchFormat", format: "bestOf5" })}
          className={`btn text-base ${
            state.matchFormat === "bestOf5" ? "btn-primary" : "btn-ghost"
          }`}
        >
          Best of 5
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GoalButton
          label={state.teamA.name}
          disabled={pending}
          onGoal={() => run({ type: "goal", side: "a", delta: 1 })}
        />
        <GoalButton
          label={state.teamB.name}
          disabled={pending}
          onGoal={() => run({ type: "goal", side: "b", delta: 1 })}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SmallBtn
          disabled={pending}
          onClick={() => run({ type: "goal", side: "a", delta: -1 })}
        >
          − A
        </SmallBtn>
        <SmallBtn disabled={pending} onClick={() => run({ type: "swapSides" })}>
          Seiten tauschen
        </SmallBtn>
        <SmallBtn
          disabled={pending}
          onClick={() => run({ type: "goal", side: "b", delta: -1 })}
        >
          − B
        </SmallBtn>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SmallBtn
          disabled={pending || state.timer.running}
          onClick={() => run({ type: "timer", action: "start" })}
        >
          Start
        </SmallBtn>
        <SmallBtn
          disabled={pending || !state.timer.running}
          onClick={() => run({ type: "timer", action: "pause" })}
        >
          Pause
        </SmallBtn>
        <SmallBtn
          disabled={pending}
          onClick={() => run({ type: "timer", action: "reset" })}
        >
          Timer ↺
        </SmallBtn>
      </div>

      <ViewSwitcher
        active={state.activeView}
        pending={pending}
        onSelect={(view) => run({ type: "setView", view })}
      />

      {state.activeView === "transition" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run({ type: "transitionComplete" }, { skipRevisionCheck: true })
          }
          className="btn btn-primary w-full text-lg"
        >
          Transition abschließen (Escape)
        </button>
      )}

      <div className="glass-panel space-y-3 p-3">
        <label className="block text-xs tracking-wide text-muted uppercase">
          Starting-Soon Text
        </label>
        <input
          value={startingDraft}
          maxLength={80}
          onChange={(e) => setStartingDraft(e.target.value)}
          onBlur={() => {
            const next = startingDraft.trim() || null;
            if (next !== (state.startingMessage ?? null)) {
              run({ type: "setStartingMessage", message: next });
            }
          }}
          className="glass-input py-2 text-sm text-white"
          placeholder="Gleich geht’s los"
        />
        <label className="block text-xs tracking-wide text-muted uppercase">
          BRB Text
        </label>
        <input
          value={brbDraft}
          maxLength={80}
          onChange={(e) => setBrbDraft(e.target.value)}
          onBlur={() => {
            const next = brbDraft.trim() || null;
            if (next !== (state.brbMessage ?? null)) {
              run({ type: "setBrbMessage", message: next });
            }
          }}
          className="glass-input py-2 text-sm text-white"
          placeholder="Kurze Pause – gleich geht’s weiter."
        />
        <label className="block text-xs tracking-wide text-muted uppercase">
          Ending Text
        </label>
        <input
          value={endingDraft}
          maxLength={80}
          onChange={(e) => setEndingDraft(e.target.value)}
          onBlur={() => {
            const next = endingDraft.trim() || null;
            if (next !== (state.endingMessage ?? null)) {
              run({ type: "setEndingMessage", message: next });
            }
          }}
          className="glass-input py-2 text-sm text-white"
          placeholder="Follow für die nächsten Matches…"
        />
      </div>

      <div className="glass-panel space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs tracking-wide text-muted uppercase">
            Overlay Sound
          </span>
          <SmallBtn
            disabled={pending}
            onClick={() =>
              run({
                type: "setSfx",
                enabled: !state.sfxEnabled,
              })
            }
          >
            {state.sfxEnabled ? "An" : "Aus"}
          </SmallBtn>
        </div>
        <label className="flex items-center gap-3 text-sm text-muted">
          <span className="w-10 tabular-nums">{volumeDraft}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volumeDraft}
            disabled={pending || !state.sfxEnabled}
            onChange={(e) => setVolumeDraft(Number(e.target.value))}
            onPointerUp={() => {
              const next = volumeDraft / 100;
              if (Math.abs(next - state.sfxVolume) > 0.01) {
                run({ type: "setSfx", volume: next });
              }
            }}
            className="w-full accent-[var(--brand-accent)]"
          />
        </label>
        <SmallBtn
          disabled={pending}
          onClick={() => run({ type: "sfxTest" })}
        >
          Sound testen (Overlay/OBS)
        </SmallBtn>
        <p className="text-[0.7rem] text-muted">
          OBS: Audio der Browser-Source aktivieren, sonst hörst du nichts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SmallBtn
          disabled={pending}
          onClick={() => run({ type: "finishSet" })}
        >
          Satz beenden
        </SmallBtn>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            confirmRun(
              "Aktuelles Spiel wirklich beenden und Zwischenstand zeigen?",
              { type: "finishMatch" },
            )
          }
          className="btn btn-danger text-xl"
        >
          Spiel beenden
        </button>
      </div>

      <SmallBtn
        disabled={pending}
        onClick={() =>
          confirmRun(
            "Komplettes Match zurücksetzen (Tore, Sätze, History)?",
            { type: "resetMatch" },
          )
        }
      >
        Match reset
      </SmallBtn>

      <p className="text-center text-xs text-muted">
        Satz: bis 5 Tore, 2 Abstand, max. 7:6 · Lineup 2D–2E–2D–2E–2D
      </p>
    </div>
  );
}

function GoalButton({
  label,
  onGoal,
  disabled,
}: {
  label: string;
  onGoal: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onGoal}
      className="btn btn-primary min-h-28 flex-col gap-1 px-2 py-4 text-white"
    >
      <span className="font-display text-4xl tracking-wide uppercase">
        Tor +
      </span>
      <span className="max-w-full truncate text-sm font-sans font-normal normal-case tracking-normal opacity-90">
        {label}
      </span>
    </button>
  );
}

function SmallBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="btn btn-ghost min-h-12 px-2 py-3 text-lg"
    >
      {children}
    </button>
  );
}

function ViewSwitcher({
  active,
  onSelect,
  pending,
}: {
  active: ActiveView;
  onSelect: (view: Exclude<ActiveView, "transition">) => void;
  pending: boolean;
}) {
  const views: Exclude<ActiveView, "transition">[] = [
    "startingSoon",
    "live",
    "standings",
    "brb",
    "ending",
  ];
  const labels: Record<Exclude<ActiveView, "transition">, string> = {
    startingSoon: "Soon",
    live: "Live",
    standings: "Stand",
    brb: "BRB",
    ending: "Ende",
  };
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {views.map((view) => {
        const isActive = active === view;
        return (
          <button
            key={view}
            type="button"
            disabled={pending || active === "transition"}
            onClick={() => onSelect(view)}
            className={`btn min-h-12 px-0.5 py-3 text-xs sm:text-sm ${
              isActive ? "btn-primary" : "btn-ghost"
            }`}
          >
            {labels[view]}
          </button>
        );
      })}
    </div>
  );
}

function TeamNameEditor({
  name,
  onSave,
  align,
}: {
  name: string;
  onSave: (name: string) => void;
  align: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name]);

  if (editing) {
    return (
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (value.trim() && value.trim() !== name) onSave(value.trim());
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className={`w-full rounded border border-white/30 bg-black/30 px-1 py-0.5 text-sm outline-none focus:border-[var(--brand-accent)] ${
          align === "right" ? "text-right" : "text-left"
        }`}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`truncate font-display text-xl text-white/90 uppercase hover:text-[var(--brand-accent)] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {name}
    </button>
  );
}
