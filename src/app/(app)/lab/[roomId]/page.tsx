import { notFound } from "next/navigation";
import { getRoomState } from "@/app/actions/rooms";
import { LabPageClient } from "@/components/lab/LabPageClient";

export default async function LabPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const res = await getRoomState(roomId);
  if (!res.ok) notFound();

  return <LabPageClient roomId={roomId} initialState={res.data.state} />;
}
