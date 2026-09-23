import { describe, expect, it } from "vitest";
import { actionErrorMessage, actionFail, actionOk } from "./result";

describe("ActionResult", () => {
  it("actionOk wraps data", () => {
    expect(actionOk({ n: 1 })).toEqual({ ok: true, data: { n: 1 } });
  });

  it("actionFail keeps machine codes", () => {
    expect(actionFail("CONFLICT")).toEqual({ ok: false, code: "CONFLICT" });
    expect(actionFail("VALIDATION", "Teamname fehlt")).toEqual({
      ok: false,
      code: "VALIDATION",
      message: "Teamname fehlt",
    });
  });

  it("actionErrorMessage prefers explicit message", () => {
    expect(actionErrorMessage(actionFail("UNKNOWN", "Netz weg"))).toBe(
      "Netz weg",
    );
  });

  it("actionErrorMessage maps protocol codes", () => {
    expect(actionErrorMessage(actionFail("CONFLICT"))).toContain("aktualisiert");
    expect(actionErrorMessage(actionFail("UNAUTHORIZED"))).toContain("PIN");
    expect(actionErrorMessage(actionFail("NOT_FOUND"))).toContain("nicht gefunden");
  });
});
