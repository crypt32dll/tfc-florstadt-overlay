import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * Daily ping so Supabase Free does not pause after ~7 days of inactivity.
 * Secured via Vercel CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "supabase_not_configured",
    });
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error, count } = await sb
    .from("rooms")
    .select("id", { count: "exact", head: true });

  if (error) {
    return Response.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    skipped: false,
    rooms: count ?? 0,
    at: new Date().toISOString(),
  });
}
