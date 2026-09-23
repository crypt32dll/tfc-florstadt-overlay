"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  checkControlAuth,
  mutateRoom,
  verifyRoomPin,
} from "@/app/actions/rooms";
import { BrandLogo } from "@/components/brand/BrandLogo";
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
  }, [timerMounted, state.timer.running, state.timer.startedAt, state.timer.elapsedMs]);

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
          err instanceof Error ? err.message : "Netzwerkfehler – bitte erneut versuchen.",
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
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pt-10 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col justify-center gap-6 pb-36">
          <BrandLogo
            priority
            className="mx-auto object-contain"
            width={220}
            height={92}
          />
          <h1 className="text-center font-[family-name:var(--font-teko)] text-4xl uppercase tracking-wide">
            Control
          </h1>
          <p className="text-center text-sm text-black/60">
            PIN eingeben, um Tore und Screens zu steuern.
          </p>
          <form
            id="pin-form"
            onSubmit={(e) => {
              void onPinSubmit(e);
            }}
            className="flex flex-col gap-3"
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
              className="rounded-sm border-2 border-black px-4 py-4 text-center text-2xl tracking-[0.4em] outline-none focus:border-[var(--brand-accent)]"
            />
          </form>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-md space-y-2">
            {authError && (
              <p
                role="alert"
                className="rounded-sm bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700"
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
              className="relative z-50 w-full touch-manipulation select-none bg-[var(--brand-accent)] px-4 py-4 font-[family-name:var(--font-teko)] text-2xl tracking-wide text-white uppercase active:opacity-90 disabled:opacity-60"
            >
              {pinLoading ? "Prüfe…" : "Freischalten"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <BrandLogo width={140} height={58} className="object-contain" />
        <div className="text-right text-xs text-black/50">
          <div>{connected ? "Live" : "Verbinde…"}</div>
          <div className="font-mono">{roomId}</div>
        </div>
      </div>

      <div className="rounded-sm border-2 border-black bg-black px-4 py-3 text-white">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamNameEditor
            name={state.teamA.name}
            onSave={(name) => run({ type: "setName", side: "a", name })}
            align="right"
          />
          <div className="font-[family-name:var(--font-teko)] text-5xl tabular-nums">
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
        <div className="mt-1 text-center font-[family-name:var(--font-teko)] text-2xl text-[var(--brand-accent)] tabular-nums">
          {formatTimer(displayedElapsed)}
        </div>
      </div>

      {(error || authError) && (
        <p className="text-center text-sm text-red-600">{error ?? authError}</p>
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
          className="border-2 border-black bg-black px-3 py-3 font-[family-name:var(--font-teko)] text-xl tracking-wide text-white uppercase disabled:opacity-50"
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
      className="flex min-h-28 flex-col items-center justify-center rounded-sm bg-[var(--brand-accent)] px-2 py-4 text-white active:scale-[0.98] disabled:opacity-50"
    >
      <span className="font-[family-name:var(--font-teko)] text-4xl tracking-wide uppercase">
        Tor +
      </span>
      <span className="max-w-full truncate text-sm opacity-90">{label}</span>
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
      className="border-2 border-black px-2 py-3 font-[family-name:var(--font-teko)] text-lg tracking-wide uppercase transition hover:bg-black hover:text-white disabled:opacity-40"
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
            className={`border-2 px-1 py-3 font-[family-name:var(--font-teko)] text-sm tracking-wide uppercase sm:text-base ${
              isActive
                ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white"
                : "border-black"
            } disabled:opacity-40`}
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
        className={`w-full border border-white/30 bg-transparent px-1 py-0.5 text-sm outline-none ${
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
      className={`truncate font-[family-name:var(--font-teko)] text-xl uppercase ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {name}
    </button>
  );
}
