import { NextResponse } from "next/server";
import { controlManifest } from "@/lib/pwa/manifest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Single Control PWA manifest (all rooms).
 * Deep links `/control/{roomId}` stay in scope; start_url is `/control`.
 */
export async function GET() {
  return NextResponse.json(controlManifest(), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
