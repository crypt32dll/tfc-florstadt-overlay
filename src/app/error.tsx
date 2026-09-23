"use client";

import { BrandMark } from "@/components/brand/BrandMark";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="glass-panel-strong max-w-md space-y-4 p-8">
        <BrandMark size={96} className="mx-auto" />
        <h1 className="font-display text-4xl tracking-wide text-white uppercase">
          Fehler
        </h1>
        <p className="max-w-md text-sm text-muted">{error.message}</p>
        <button type="button" onClick={reset} className="btn btn-primary px-6 text-xl">
          Nochmal
        </button>
      </div>
    </div>
  );
}
