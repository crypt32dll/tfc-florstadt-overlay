import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { cronUnauthorized } from "./result";

/**
 * Fail-closed CRON_SECRET check. Returns a 401 Response when unauthorized;
 * null when the request may proceed.
 */
export function assertCronAuthorized(request: NextRequest): Response | null {
  if (!isAuthorized(request)) {
    return cronUnauthorized();
  }
  return null;
}

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
