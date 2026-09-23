import { notFound } from "next/navigation";
import { getRoomState } from "@/app/actions/rooms";
import { OverlayBodyClass } from "@/components/overlay/OverlayBodyClass";
import { OverlayShell } from "@/components/overlay/OverlayShell";

export default async function OverlayPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const res = await getRoomState(roomId);
  if (!res.ok) notFound();

  return (
    <>
      <OverlayBodyClass />
      <OverlayShell
        roomId={roomId}
        initialState={res.data.state}
        mode="overlay"
      />
    </>
  );
}
