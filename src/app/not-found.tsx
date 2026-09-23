import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-[family-name:var(--font-teko)] text-4xl uppercase">
        Raum nicht gefunden
      </h1>
      <p className="text-sm text-black/70">
        Der Raum existiert nicht (mehr) oder ist abgelaufen.
      </p>
      <Link
        href="/"
        className="bg-[var(--brand-accent)] px-4 py-2 font-[family-name:var(--font-teko)] text-xl text-white uppercase"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
