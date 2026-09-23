const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkPinRateLimit(key: string, limit = 8, windowMs = 60_000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }
  if (entry.count >= limit) {
    return { ok: false as const, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { ok: true as const };
}
