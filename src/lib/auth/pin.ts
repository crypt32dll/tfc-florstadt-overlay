import bcrypt from "bcryptjs";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function generatePin(length = 4): string {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return out;
}
