"use client";

import { KickerFigure } from "@/components/overlay/KickerFigure";
import { useNow } from "@/lib/hooks/useNow";
import { formatTimer, getElapsedMs } from "@/lib/match/format";
import type { MatchState } from "@/lib/match/types";

/** Isolates the 250ms tick so ControlPanel doesn't re-render at 4Hz. */
export function LiveTimerDisplay({ state }: { state: MatchState }) {
  const timerRunning = state.timer.running;
  const now = useNow(timerRunning, 250);
  const displayedElapsed =
    !state.timer.running || now === 0
      ? state.timer.elapsedMs
      : getElapsedMs(state, now);

  return (
    <div className="mt-1 text-center font-display text-2xl text-[var(--brand-accent)] tabular-nums">
      {formatTimer(displayedElapsed)}
    </div>
  );
}

export function GoalButton({
  label,
  color,
  onGoal,
  busy,
}: {
  label: string;
  color: MatchState["teamAColor"];
  onGoal: () => void;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      aria-busy={busy}
      onClick={onGoal}
      className="btn btn-primary flex min-h-28 flex-col gap-0.5 px-2 py-4 text-white"
    >
      <span className="font-display text-4xl tracking-wide uppercase">
        Tor +
      </span>
      <span className="flex max-w-full items-center justify-center gap-1.5 text-xs font-sans font-normal normal-case tracking-normal opacity-90 sm:text-sm">
        <KickerFigure color={color} size={22} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}

export function UndoGoalButton({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: MatchState["teamAColor"];
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Tor zurücknehmen ${label}`}
      className="btn btn-ghost flex min-h-16 flex-col items-center justify-center gap-0.5 px-2 py-2"
    >
      <span className="font-display text-xl leading-none tracking-wide uppercase">
        Tor −
      </span>
      <span className="flex max-w-full items-center justify-center gap-1 text-xs font-sans font-normal normal-case tracking-normal opacity-90">
        <KickerFigure color={color} size={18} className="shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </button>
  );
}

export function SmallBtn({
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
