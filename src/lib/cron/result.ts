/**
 * Machine contract for Vercel cron routes.
 * Do not reuse ActionResult — that interface is UI-facing (German copy + data).
 */

export type CronSkipReason = "supabase_not_configured";

export type CronOkBody = {
  ok: true;
  skipped?: false;
  at: string;
} & Record<string, unknown>;

export type CronSkippedBody = {
  ok: true;
  skipped: true;
  reason: CronSkipReason;
};

export type CronErrorBody = {
  ok: false;
  error: string;
};

export type CronResultBody = CronOkBody | CronSkippedBody | CronErrorBody;

export function cronUnauthorized(): Response {
  return Response.json(
    { ok: false, error: "unauthorized" } satisfies CronErrorBody,
    { status: 401 },
  );
}

export function cronSkipped(reason: CronSkipReason): Response {
  return Response.json({
    ok: true,
    skipped: true,
    reason,
  } satisfies CronSkippedBody);
}

export function cronOk(payload: Record<string, unknown> = {}): Response {
  return Response.json({
    ok: true,
    skipped: false,
    at: new Date().toISOString(),
    ...payload,
  } satisfies CronOkBody);
}

export function cronError(error: unknown, status = 500): Response {
  return Response.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "unknown",
    } satisfies CronErrorBody,
    { status },
  );
}
