import { notFound } from "next/navigation";
import { getRoomState } from "@/app/actions/rooms";
import { ControlPanel } from "@/components/control/ControlPanel";

export default async function ControlPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const res = await getRoomState(roomId);
  if (!res.ok) notFound();

  return <ControlPanel roomId={roomId} initialState={res.data.state} />;
}
