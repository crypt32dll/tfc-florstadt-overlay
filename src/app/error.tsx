"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-[family-name:var(--font-teko)] text-4xl uppercase">
        Fehler
      </h1>
      <p className="max-w-md text-sm text-black/70">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="border-2 border-black px-4 py-2 font-[family-name:var(--font-teko)] text-xl uppercase"
      >
        Nochmal
      </button>
    </div>
  );
}
