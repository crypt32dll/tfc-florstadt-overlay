"use client";

import { useEffect } from "react";

type Props = {
  message: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** In-app confirm for Control PWA — replaces window.confirm. */
export function ConfirmSheet({ message, busy, onConfirm, onCancel }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Abbrechen"
        disabled={busy}
        onClick={onCancel}
        className="absolute inset-0 bg-black/65"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-describedby="confirm-sheet-msg"
        className="glass-panel-strong relative z-10 w-full max-w-md space-y-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <p
          id="confirm-sheet-msg"
          className="text-center text-base leading-snug text-white"
        >
          {message}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="btn btn-ghost min-h-14 text-xl"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            onClick={onConfirm}
            className="btn btn-danger min-h-14 text-xl"
          >
            {busy ? "…" : "Bestätigen"}
          </button>
        </div>
      </div>
    </div>
  );
}
