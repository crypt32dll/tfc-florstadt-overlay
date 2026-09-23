/**
 * UI-facing server-action envelope.
 * Machine codes stay on the wire; German copy is mapped at the Control / form edge.
 * Distinct from CronResult (cron routes).
 */

export type ActionErrorCode =
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "SESSION"
  | "UNKNOWN";

export type ActionOk<T> = { ok: true; data: T };

export type ActionFail = {
  ok: false;
  code: ActionErrorCode;
  /** Optional German detail (validation, cookie, unexpected). */
  message?: string;
};

export type ActionResult<T> = ActionOk<T> | ActionFail;

export function actionOk<T>(data: T): ActionOk<T> {
  return { ok: true, data };
}

export function actionFail(
  code: ActionErrorCode,
  message?: string,
): ActionFail {
  return message != null ? { ok: false, code, message } : { ok: false, code };
}

/** Map protocol codes (+ optional message) to German UI strings. */
export function actionErrorMessage(result: ActionFail): string {
  if (result.message) return result.message;
  switch (result.code) {
    case "CONFLICT":
      return "Zustand aktualisiert – bitte erneut tippen.";
    case "UNAUTHORIZED":
      return "Session abgelaufen – bitte PIN erneut eingeben.";
    case "NOT_FOUND":
      return "Raum nicht gefunden";
    case "RATE_LIMITED":
      return "Zu viele Versuche. Bitte kurz warten.";
    case "VALIDATION":
      return "Eingaben prüfen";
    case "SESSION":
      return "Session konnte nicht gesetzt werden";
    default:
      return "Aktion fehlgeschlagen";
  }
}
