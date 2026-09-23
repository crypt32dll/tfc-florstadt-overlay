import { createLiteLogger } from "tslog/lite";

const isProd = process.env.NODE_ENV === "production";

/**
 * Browser logger for `"use client"` components.
 * Uses native console.* so DevTools keeps correct file:line.
 */
export const log = createLiteLogger({
  name: "tfc",
  minLevel: isProd ? "WARN" : "SILLY",
});

export function clientLog(scope: string) {
  return log.getSubLogger({ name: scope });
}
