import bcrypt from "bcryptjs";

/**
 * Legacy: rooms.pin_hash column still filled on create for schema compat.
 * Auth uses CONTROL_PIN / club PIN — not per-room bcrypt verify.
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}
