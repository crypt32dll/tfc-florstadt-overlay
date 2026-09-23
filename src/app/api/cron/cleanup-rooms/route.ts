import type { NextRequest } from "next/server";
import { assertCronAuthorized } from "@/lib/cron/auth";
import { cronError, cronOk, cronSkipped } from "@/lib/cron/result";
import { actionLog } from "@/lib/logger.server";
import { getStore, hasSupabaseConfig } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = actionLog("cron:cleanup-rooms");
/** Delete rooms idle longer than 7 days */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_AGE_DAYS = 7;

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
    const deleted = await store.deleteOlderThan(MAX_AGE_MS);
    log.info("cleanup ok", { deleted });
    return cronOk({ deleted, maxAgeDays: MAX_AGE_DAYS });
  } catch (e) {
    log.error("cleanup crashed", e);
    return cronError(e);
  }
}
