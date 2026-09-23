import { CreateRoomForm } from "@/components/brand/CreateRoomForm";

export default function HomePage() {
  return (
    <main className="app-shell flex h-dvh max-h-dvh flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid h-full w-full max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-6">
        <div className="flex min-h-0 items-center justify-center overflow-y-auto">
          <CreateRoomForm />
        </div>
        <aside className="glass-panel flex min-h-0 flex-col justify-start gap-6 overflow-y-auto p-5 sm:p-6 md:self-center md:justify-center">
          <section>
            <h2 className="font-display text-2xl tracking-wide text-white uppercase sm:text-3xl">
              Schnellstart
            </h2>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-muted">
              <li>Raum erstellen und PIN notieren</li>
              <li>
                <strong className="text-white/90">Preview Lab</strong> auf dem
                Laptop öffnen
              </li>
              <li>QR mit dem Handy scannen → Control → PIN</li>
              <li>Tore tippen &amp; Screens wechseln testen</li>
              <li>Overlay-URL in OBS einbinden (siehe unten)</li>
            </ol>
          </section>

          <section className="border-t border-white/10 pt-5">
            <h2 className="font-display text-2xl tracking-wide text-white uppercase sm:text-3xl">
              OBS Studio
            </h2>
            <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm text-muted">
              <li>
                Quelle hinzufügen →{" "}
                <strong className="text-white/90">Browser</strong>
              </li>
              <li>
                URL:{" "}
                <code className="rounded bg-black/35 px-1.5 py-0.5 text-xs text-[var(--brand-accent)]">
                  …/overlay/RAUM-ID
                </code>{" "}
                (aus dem Lab kopieren)
              </li>
              <li>
                Breite <strong className="text-white/90">1920</strong>, Höhe{" "}
                <strong className="text-white/90">1080</strong>
              </li>
              <li>
                <strong className="text-white/90">
                  „Quelle deaktivieren, wenn nicht sichtbar“
                </strong>{" "}
                abwählen
              </li>
              <li>Custom CSS (empfohlen) einfügen:</li>
            </ol>
            <pre className="mt-3 overflow-x-auto rounded-[var(--radius-control)] border border-white/10 bg-black/40 p-3 text-[0.7rem] leading-relaxed text-white/80">
              {`body {
  background-color: rgba(0, 0, 0, 0) !important;
  margin: 0 !important;
  overflow: hidden !important;
}`}
            </pre>
            <p className="mt-3 text-xs text-muted">
              So bleibt der Hintergrund transparent und nur Scoreboard /
              Screens sind sichtbar.
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}
