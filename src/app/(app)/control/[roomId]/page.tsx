import { notFound } from "next/navigation";
import { getRoomState } from "@/app/actions/rooms";
import { ControlPanel } from "@/components/control/ControlPanel";
import { RememberControlRoom } from "@/components/control/RememberControlRoom";

export default async function ControlPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const res = await getRoomState(roomId);
  if (!res.ok) notFound();

  return (
    <>
      <RememberControlRoom roomId={roomId} />
      <ControlPanel roomId={roomId} initialState={res.data.state} />
    </>
  );
}
