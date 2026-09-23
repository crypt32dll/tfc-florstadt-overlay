"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkControlAuth,
  mutateRoom,
  verifyRoomPin,
} from "@/app/actions/rooms";
import { BrandMark } from "@/components/brand/BrandMark";
import { formatTimer, getElapsedMs } from "@/lib/match/defaults";
import { useRoomState } from "@/lib/hooks/useRoomState";
import type { ActiveView, MatchState } from "@/lib/match/types";

type Props = {
  roomId: string;
  initialState: MatchState;
};

export function ControlPanel({ roomId, initialState }: Props) {
  const { state, setState, connected, error } = useRoomState(
    roomId,
    initialState,
  );
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [timerMounted, setTimerMounted] = useState(false);
  const [now, setNow] = useState(0);
  const pinSubmitting = useRef(false);

  useEffect(() => {
    void checkControlAuth(roomId).then((res) => {
      if (res.ok) setAuthorized(res.data.authorized);
    });
  }, [roomId]);

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

  const displayedElapsed =
    !timerMounted || !state.timer.running
      ? state.timer.elapsedMs
      : getElapsedMs(state, now);

  const run = (mutation: Parameters<typeof mutateRoom>[1]) => {
    startTransition(async () => {
      try {
        const res = await mutateRoom(roomId, mutation);
        if (!res.ok) {
          if (res.error === "UNAUTHORIZED") {
            setAuthorized(false);
            setAuthError("Session abgelaufen – bitte PIN erneut eingeben.");
          } else {
            setAuthError(res.error);
          }
          return;
        }
        setAuthError(null);
        setState(res.data.state);
      } catch (err) {
        setAuthError(
          err instanceof Error
            ? err.message
            : "Netzwerkfehler – bitte erneut versuchen.",
        );
      }
    });
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
        return;
      }
      setAuthorized(true);
      setPin("");
    } catch (err) {
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
          <div className={connected ? "badge-live" : "text-muted"}>
            {connected ? "Live" : "Verbinde…"}
          </div>
          <div className="mt-1 font-mono text-muted">{roomId}</div>
        </div>
      </div>

      <div className="glass-panel-strong px-4 py-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamNameEditor
            name={state.teamA.name}
            onSave={(name) => run({ type: "setName", side: "a", name })}
            align="right"
          />
          <div className="font-display text-5xl tabular-nums text-white">
            {state.teamA.score}
            <span className="text-[var(--brand-accent)]">:</span>
            {state.teamB.score}
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

      {(error || authError) && (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200"
        >
          {error ?? authError}
        </p>
      )}

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

      <div className="grid grid-cols-2 gap-2">
        <SmallBtn
          disabled={pending}
          onClick={() => run({ type: "resetMatch" })}
        >
          Match reset
        </SmallBtn>
        <button
          type="button"
          disabled={pending}
          onClick={() => run({ type: "finishMatch" })}
          className="btn btn-danger text-xl"
        >
          Spiel beenden
        </button>
      </div>
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
  ];
  const labels = {
    startingSoon: "Starting Soon",
    live: "Live",
    standings: "Zwischenstand",
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {views.map((view) => {
        const isActive = active === view;
        return (
          <button
            key={view}
            type="button"
            disabled={pending || active === "transition"}
            onClick={() => onSelect(view)}
            className={`btn min-h-12 px-1 py-3 text-sm sm:text-base ${
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
