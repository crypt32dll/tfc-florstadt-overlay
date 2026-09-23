import { describe, expect, it } from "vitest";
import {
  cronError,
  cronOk,
  cronSkipped,
  cronUnauthorized,
} from "@/lib/cron/result";

describe("CronResult helpers", () => {
  it("returns machine unauthorized JSON", async () => {
    const res = cronUnauthorized();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "unauthorized",
    });
  });

  it("returns skipped reason without prose message", async () => {
    const res = cronSkipped("supabase_not_configured");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      skipped: true,
      reason: "supabase_not_configured",
    });
  });

  it("stamps ok payloads with at", async () => {
    const res = cronOk({ rooms: 3 });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(false);
    expect(body.rooms).toBe(3);
    expect(typeof body.at).toBe("string");
  });

  it("maps thrown errors to machine error bodies", async () => {
    const res = cronError(new Error("boom"), 502);
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "boom",
    });
  });
});
