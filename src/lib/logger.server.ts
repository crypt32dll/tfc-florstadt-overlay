import "server-only";

import { Logger, type ILogObj } from "tslog";

const isProd = process.env.NODE_ENV === "production";

/**
 * Server logger (Server Actions, Route Handlers, RSC).
 * Pretty locally; JSON on Vercel for searchable Runtime Logs.
 */
export const log = new Logger<ILogObj>({
  name: "tfc",
  type: isProd ? "json" : "pretty",
  minLevel: isProd ? "INFO" : "SILLY",
  stack: { capture: isProd ? "off" : "auto" },
  mask: {
    keys: ["pin", "password", "token", "authorization", "cookie"],
    caseInsensitive: true,
  },
});

export function actionLog(scope: string) {
  return log.getSubLogger({ name: scope });
}
