import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { actionLog } from "@/lib/logger.server";
import { getStore, hasSupabaseConfig } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = actionLog("cron:cleanup-rooms");
/** Delete rooms idle longer than 7 days */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const token = header.slice("Bearer ".length);
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    log.warn("unauthorized cron request");
    return new Response("Unauthorized", { status: 401 });
  }

  if (!hasSupabaseConfig()) {
    log.info("skipped – supabase not configured");
    return Response.json({
      ok: true,
      skipped: true,
      reason: "supabase_not_configured",
    });
  }

  try {
    const store = await getStore();
    const deleted = await store.deleteOlderThan(MAX_AGE_MS);
    log.info("cleanup ok", { deleted });
    return Response.json({
      ok: true,
      deleted,
      maxAgeDays: 7,
      at: new Date().toISOString(),
    });
  } catch (e) {
    log.error("cleanup crashed", e);
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 },
    );
  }
}
