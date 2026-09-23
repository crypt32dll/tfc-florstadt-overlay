import type { NextRequest } from "next/server";
import { assertCronAuthorized } from "@/lib/cron/auth";
import { cronError, cronOk, cronSkipped } from "@/lib/cron/result";
import { actionLog } from "@/lib/logger.server";
import { getStore, hasSupabaseConfig } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = actionLog("cron:keep-alive");

/**
 * Daily ping so Supabase Free does not pause after ~7 days of inactivity.
 * Secured via Vercel CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(request: NextRequest) {
  const denied = assertCronAuthorized(request);
  if (denied) {
    log.warn("unauthorized cron request");
    return denied;
  }

  if (!hasSupabaseConfig()) {
    log.info("skipped – supabase not configured");
    return cronSkipped("supabase_not_configured");
  }

  try {
    const store = await getStore();
    const rooms = await store.countRooms();
    log.info("keep-alive ok", { rooms });
    return cronOk({ rooms });
  } catch (e) {
    log.error("keep-alive crashed", e);
    return cronError(e, 502);
  }
}
