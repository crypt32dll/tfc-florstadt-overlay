import { CreateRoomForm } from "@/components/brand/CreateRoomForm";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#0a0a0a_0%,#0a0a0a_42%,#ffffff_42%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <CreateRoomForm />
        <section className="mx-auto mt-10 max-w-lg space-y-3 text-sm text-black/70">
          <h2 className="font-[family-name:var(--font-teko)] text-2xl uppercase text-black">
            Schnellstart
          </h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Raum erstellen und PIN notieren</li>
            <li>
              <strong>Preview Lab</strong> auf dem Laptop öffnen
            </li>
            <li>QR mit dem Handy scannen → Control → PIN</li>
            <li>Tore tippen &amp; Screens wechseln testen</li>
            <li>Für den Stream: Overlay-URL in OBS Browser Source (1920×1080)</li>
          </ol>
          <p className="rounded-sm border border-amber-600/30 bg-amber-50 p-3 text-amber-950">
            <strong>Supabase Free:</strong> Projekte pausieren nach ~7 Tagen
            Inaktivität. Vor Spieltagen im{" "}
            <a
              className="text-[var(--brand-accent)] underline"
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              Dashboard
            </a>{" "}
            ggf. „Restore/Resume“ und 1–2 Minuten warten.
          </p>
        </section>
      </div>
    </main>
  );
}
