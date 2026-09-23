import { CreateRoomForm } from "@/components/brand/CreateRoomForm";

export default function HomePage() {
  return (
    <main className="app-shell flex h-dvh max-h-dvh flex-col overflow-hidden px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid h-full w-full max-w-5xl grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-6">
        <div className="flex min-h-0 items-center justify-center overflow-y-auto">
          <CreateRoomForm />
        </div>
        <aside className="glass-panel flex min-h-0 flex-col justify-center overflow-y-auto p-5 sm:p-6 md:self-center">
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
            <li>
              Für den Stream: Overlay-URL in OBS Browser Source (1920×1080)
            </li>
          </ol>
        </aside>
      </div>
    </main>
  );
}
