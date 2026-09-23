"use server";

import { customAlphabet } from "nanoid";
import { headers } from "next/headers";
import {
  assertRoomAuthorized,
  createRoomSession,
  getAuthorizedRoomId,
} from "@/lib/auth/session";
import { generatePin, hashPin, verifyPin } from "@/lib/auth/pin";
import { checkPinRateLimit } from "@/lib/auth/rate-limit";
import { applyMutation, createInitialState, normalizeState } from "@/lib/match/defaults";
import {
  createRoomSchema,
  mutationSchema,
  verifyPinSchema,
} from "@/lib/match/schema";
import type { MatchState, RoomMutation } from "@/lib/match/types";
import { getStore, hasSupabaseConfig } from "@/lib/store";
import { ZodError } from "zod";

const roomId = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8);

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createRoom(input?: {
  pin?: string;
  teamA?: string;
  teamB?: string;
}): Promise<
  ActionResult<{ roomId: string; pin: string; storeMode: "memory" | "supabase" }>
> {
  try {
    const parsed = createRoomSchema.parse({
      pin: input?.pin,
      teamA: input?.teamA ?? "",
      teamB: input?.teamB ?? "",
    });
    const pin = parsed.pin ?? generatePin(4);
    const id = roomId();
    const store = await getStore();
    const state = createInitialState(parsed.teamA, parsed.teamB);
    await store.create({
      id,
      pinHash: await hashPin(pin),
      state,
      updatedAt: state.updatedAt,
    });
    await createRoomSession(id);
    return {
      ok: true,
      data: { roomId: id, pin, storeMode: store.mode },
    };
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.issues[0]?.message;
      return {
        ok: false,
        error: first ?? "Eingaben prüfen",
      };
    }
    const message =
      e instanceof Error ? e.message : "Raum konnte nicht erstellt werden";
    return { ok: false, error: message };
  }
}

export async function getRoomState(
  roomIdParam: string,
): Promise<ActionResult<{ state: MatchState; storeMode: "memory" | "supabase" }>> {
  try {
    const store = await getStore();
    const room = await store.get(roomIdParam);
    if (!room) return { ok: false, error: "Raum nicht gefunden" };
    return {
      ok: true,
      data: { state: normalizeState(room.state), storeMode: store.mode },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Laden fehlgeschlagen",
    };
  }
}

export async function verifyRoomPin(input: {
  roomId: string;
  pin: string;
}): Promise<ActionResult<{ authorized: true }>> {
  try {
    const parsed = verifyPinSchema.parse(input);
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rate = checkPinRateLimit(`${ip}:${parsed.roomId}`);
    if (!rate.ok) {
      return { ok: false, error: "Zu viele Versuche. Bitte kurz warten." };
    }

    const store = await getStore();
    const room = await store.get(parsed.roomId);
    if (!room) return { ok: false, error: "Raum nicht gefunden" };

    const valid = await verifyPin(parsed.pin, room.pinHash);
    if (!valid) return { ok: false, error: "Falscher PIN" };

    try {
      await createRoomSession(parsed.roomId);
    } catch (sessionErr) {
      const msg =
        sessionErr instanceof Error
          ? sessionErr.message
          : "Session konnte nicht gesetzt werden";
      return { ok: false, error: `Login ok, aber Cookie-Fehler: ${msg}` };
    }
    return { ok: true, data: { authorized: true } };
  } catch (e) {
    if (e && typeof e === "object" && "issues" in e) {
      return { ok: false, error: "Ungültige PIN-Eingabe." };
    }
    const message =
      e && typeof e === "object" && "message" in e && typeof e.message === "string"
        ? e.message
        : e instanceof Error
          ? e.message
          : "PIN-Prüfung fehlgeschlagen";
    return { ok: false, error: message };
  }
}

export async function checkControlAuth(
  roomIdParam: string,
): Promise<ActionResult<{ authorized: boolean }>> {
  const authorized = (await getAuthorizedRoomId()) === roomIdParam;
  return { ok: true, data: { authorized } };
}

async function applyAndSave(
  roomIdParam: string,
  mutation: RoomMutation,
): Promise<ActionResult<{ state: MatchState }>> {
  const store = await getStore();
  const room = await store.get(roomIdParam);
  if (!room) return { ok: false, error: "Raum nicht gefunden" };

  const nextState = normalizeState(applyMutation(room.state, mutation));
  await store.save({
    ...room,
    state: nextState,
    updatedAt: nextState.updatedAt,
  });
  return { ok: true, data: { state: nextState } };
}

export async function mutateRoom(
  roomIdParam: string,
  mutationInput: RoomMutation,
): Promise<ActionResult<{ state: MatchState }>> {
  try {
    await assertRoomAuthorized(roomIdParam);
    const mutation = mutationSchema.parse(mutationInput);
    return applyAndSave(roomIdParam, mutation);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return { ok: false, error: "UNAUTHORIZED" };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Aktion fehlgeschlagen",
    };
  }
}

/** Overlay may complete transitions without control session (read-only clients). */
export async function completeTransition(
  roomIdParam: string,
): Promise<ActionResult<{ state: MatchState }>> {
  try {
    return applyAndSave(roomIdParam, { type: "transitionComplete" });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Transition fehlgeschlagen",
    };
  }
}

export async function getStoreInfo(): Promise<{
  mode: "memory" | "supabase";
  supabaseConfigured: boolean;
}> {
  return {
    mode: hasSupabaseConfig() ? "supabase" : "memory",
    supabaseConfigured: hasSupabaseConfig(),
  };
}
