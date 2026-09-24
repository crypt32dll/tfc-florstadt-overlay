import { CreateRoomForm } from "@/components/brand/CreateRoomForm";

export default function HomePage() {
  return (
    <main className="app-shell flex flex-col px-4 py-4 sm:px-6 sm:py-6 md:h-dvh md:max-h-dvh md:overflow-hidden">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-stretch gap-4 md:h-full md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-6">
        <div className="flex items-center justify-center md:min-h-0 md:overflow-y-auto">
          <CreateRoomForm />
        </div>
        <aside className="glass-panel flex flex-col justify-start gap-6 p-5 sm:p-6 md:min-h-0 md:justify-center md:self-center md:overflow-y-auto">
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
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
