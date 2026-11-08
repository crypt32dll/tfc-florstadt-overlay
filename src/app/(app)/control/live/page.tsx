import Link from "next/link";
import { getLiveOverlayRoom } from "@/app/actions/rooms";
import { LiveControlClient } from "@/components/control/LiveControlClient";

export default async function LiveControlPage() {
  const res = await getLiveOverlayRoom();
  if (!res.ok) {
    return (
      <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl tracking-wide text-white uppercase">
          Kein Live-Raum
        </h1>
        <p className="max-w-sm text-sm text-muted">
          Zuerst auf der Startseite ein Match anlegen — danach ist Control unter
          dieser URL immer erreichbar.
        </p>
        <Link href="/" className="btn btn-primary text-xl">
          Raum erstellen
        </Link>
      </div>
    );
  }

  return (
    <LiveControlClient
      initialRoomId={res.data.roomId}
      initialState={res.data.state}
    />
  );
}
