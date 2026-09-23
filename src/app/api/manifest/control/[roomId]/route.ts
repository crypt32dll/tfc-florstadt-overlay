import { NextResponse } from "next/server";
import { controlManifest, isValidRoomId } from "@/lib/pwa/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ roomId: string }> };

/**
 * Room-scoped web manifest so "Add to Home Screen" / PWA install from Control
 * launches `/control/{roomId}` instead of `/`.
 */
export async function GET(_request: Request, { params }: Params) {
  const { roomId } = await params;
  if (!isValidRoomId(roomId)) {
    return NextResponse.json({ error: "invalid_room" }, { status: 400 });
  }

  return NextResponse.json(controlManifest(roomId), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
