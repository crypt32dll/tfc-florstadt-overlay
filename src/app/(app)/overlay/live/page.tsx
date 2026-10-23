import { notFound } from "next/navigation";
import { getLiveOverlayRoom } from "@/app/actions/rooms";
import { LiveOverlayClient } from "@/components/overlay/LiveOverlayClient";
import { OverlayBodyClass } from "@/components/overlay/OverlayBodyClass";

export default async function LiveOverlayPage() {
  const res = await getLiveOverlayRoom();
  if (!res.ok) notFound();

  return (
    <>
      <OverlayBodyClass />
      <LiveOverlayClient
        initialRoomId={res.data.roomId}
        initialState={res.data.state}
      />
    </>
  );
}
