import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { actionLog } from "@/lib/logger.server";

const COOKIE_NAME = "tfc_room_session";
const MAX_AGE_SEC = 60 * 60 * 12; // 12h
const log = actionLog("session");

function getSecret() {
  const secret =
    process.env.ROOM_SESSION_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "dev-only-tfc-florstadt-session-secret-32b"
      : undefined);
  if (!secret || secret.length < 32) {
    throw new Error(
      "ROOM_SESSION_SECRET muss gesetzt sein (mind. 32 Zeichen).",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createRoomSession(roomId: string): Promise<void> {
  const token = await new SignJWT({ roomId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearRoomSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAuthorizedRoomId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const roomId = payload.roomId;
    return typeof roomId === "string" ? roomId : null;
  } catch (e) {
    log.debug("invalid or expired session cookie", e);
    return null;
  }
}

export async function assertRoomAuthorized(roomId: string): Promise<void> {
  const authorized = await getAuthorizedRoomId();
  if (authorized !== roomId) {
    throw new Error("UNAUTHORIZED");
  }
}
