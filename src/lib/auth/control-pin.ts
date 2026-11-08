/**
 * Club-wide Control PIN (Option A): one fixed code for every room.
 * Server: CONTROL_PIN (preferred) or NEXT_PUBLIC_CONTROL_PIN
 * Client QR/auto-login: NEXT_PUBLIC_CONTROL_PIN
 */
export function getControlPin(): string {
  const pin =
    process.env.CONTROL_PIN?.trim() ||
    process.env.NEXT_PUBLIC_CONTROL_PIN?.trim() ||
    "";
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error(
      "CONTROL_PIN (oder NEXT_PUBLIC_CONTROL_PIN) muss 4–6 Ziffern sein.",
    );
  }
  return pin;
}

/** Client-safe: only the public env (undefined if unset). */
export function getPublicControlPin(): string | null {
  const pin = process.env.NEXT_PUBLIC_CONTROL_PIN?.trim() ?? "";
  return /^\d{4,6}$/.test(pin) ? pin : null;
}

export function isValidControlPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin.replace(/\D/g, ""));
}
