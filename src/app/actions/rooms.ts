"use server";

import { customAlphabet } from "nanoid";
import { headers } from "next/headers";
import { ZodError } from "zod";
import {
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/action/result";
import { generatePin, hashPin, verifyPin } from "@/lib/auth/pin";
import { checkPinRateLimit } from "@/lib/auth/rate-limit";
import {
  assertRoomAuthorized,
  createRoomSession,
  getAuthorizedRoomId,
} from "@/lib/auth/session";
import { actionLog } from "@/lib/logger.server";
import { applyMutation, createInitialState } from "@/lib/match/engine";
import { normalizeState } from "@/lib/match/migrate";
import {
  createRoomSchema,
  mutationSchema,
  verifyPinSchema,
} from "@/lib/match/schema";
import type { MatchState, RoomMutation } from "@/lib/match/types";
import { getStore, hasSupabaseConfig } from "@/lib/store";

const roomId = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 8);
const log = actionLog("rooms");

export type { ActionResult } from "@/lib/action/result";

export async function createRoom(input?: {
  pin?: string;
  teamA?: string;
  teamB?: string;
}): Promise<
  ActionResult<{
    roomId: string;
    pin: string;
    storeMode: "memory" | "supabase";
  }>
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
    log.info("room created", { roomId: id, storeMode: store.mode });
    return actionOk({ roomId: id, pin, storeMode: store.mode });
  } catch (e) {
    if (e instanceof ZodError) {
      const first = e.issues[0]?.message;
      log.warn("createRoom validation failed", { issues: e.issues });
      return actionFail("VALIDATION", first ?? "Eingaben prüfen");
    }
    log.error("createRoom failed", e);
    const message =
      e instanceof Error ? e.message : "Raum konnte nicht erstellt werden";
    return actionFail("UNKNOWN", message);
  }
}

export async function getRoomState(
  roomIdParam: string,
): Promise<
  ActionResult<{ state: MatchState; storeMode: "memory" | "supabase" }>
> {
  try {
    const store = await getStore();
    const room = await store.get(roomIdParam);
    if (!room) return actionFail("NOT_FOUND");
    return actionOk({
      state: normalizeState(room.state),
      storeMode: store.mode,
    });
  } catch (e) {
    log.error("getRoomState failed", { roomId: roomIdParam }, e);
    return actionFail(
      "UNKNOWN",
      e instanceof Error ? e.message : "Laden fehlgeschlagen",
    );
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
      log.warn("PIN rate limited", { roomId: parsed.roomId, ip });
      return actionFail("RATE_LIMITED");
    }

    const store = await getStore();
    const room = await store.get(parsed.roomId);
    if (!room) return actionFail("NOT_FOUND");

    const valid = await verifyPin(parsed.pin, room.pinHash);
    if (!valid) {
      log.warn("PIN rejected", { roomId: parsed.roomId, ip });
      return actionFail("UNAUTHORIZED", "Falscher PIN");
    }

    try {
      await createRoomSession(parsed.roomId);
    } catch (sessionErr) {
      log.error(
        "session cookie failed after PIN ok",
        { roomId: parsed.roomId },
        sessionErr,
      );
      const msg =
        sessionErr instanceof Error
          ? sessionErr.message
          : "Session konnte nicht gesetzt werden";
      return actionFail("SESSION", `Login ok, aber Cookie-Fehler: ${msg}`);
    }
    log.info("PIN ok", { roomId: parsed.roomId });
    return actionOk({ authorized: true });
  } catch (e) {
    if (e && typeof e === "object" && "issues" in e) {
      log.warn("verifyRoomPin validation failed", e);
      return actionFail("VALIDATION", "Ungültige PIN-Eingabe.");
    }
    log.error("verifyRoomPin failed", { roomId: input.roomId }, e);
    const message =
      e &&
      typeof e === "object" &&
      "message" in e &&
      typeof e.message === "string"
        ? e.message
        : e instanceof Error
          ? e.message
          : "PIN-Prüfung fehlgeschlagen";
    return actionFail("UNKNOWN", message);
  }
}

export async function checkControlAuth(
  roomIdParam: string,
): Promise<ActionResult<{ authorized: boolean }>> {
  const authorized = (await getAuthorizedRoomId()) === roomIdParam;
  return actionOk({ authorized });
}

async function applyAndSave(
  roomIdParam: string,
  mutation: RoomMutation,
  expectedRevision?: number,
): Promise<ActionResult<{ state: MatchState }>> {
  const store = await getStore();
  const room = await store.get(roomIdParam);
  if (!room) return actionFail("NOT_FOUND");

  const current = normalizeState(room.state);
  if (expectedRevision != null && current.revision !== expectedRevision) {
    log.warn("revision conflict", {
      roomId: roomIdParam,
      expected: expectedRevision,
      actual: current.revision,
    });
    return actionFail("CONFLICT");
  }

  const nextState = applyMutation(current, mutation);
  if (nextState.revision === current.revision) {
    return actionOk({ state: current });
  }

  const cas = await store.saveIfRevision(
    {
      ...room,
      state: nextState,
      updatedAt: nextState.updatedAt,
    },
    current.revision,
  );
  if (cas === "missing") return actionFail("NOT_FOUND");
  if (cas === "conflict") {
    log.warn("revision CAS conflict", {
      roomId: roomIdParam,
      expected: current.revision,
    });
    return actionFail("CONFLICT");
  }
  return actionOk({ state: nextState });
}

export async function mutateRoom(
  roomIdParam: string,
  mutationInput: RoomMutation,
  opts?: { expectedRevision?: number },
): Promise<ActionResult<{ state: MatchState }>> {
  try {
    await assertRoomAuthorized(roomIdParam);
    const mutation = mutationSchema.parse(mutationInput);
    return applyAndSave(roomIdParam, mutation, opts?.expectedRevision);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      log.warn("mutateRoom unauthorized", { roomId: roomIdParam });
      return actionFail("UNAUTHORIZED");
    }
    if (e instanceof ZodError) {
      log.warn("mutateRoom validation failed", { issues: e.issues });
      return actionFail("VALIDATION", e.issues[0]?.message);
    }
    log.error(
      "mutateRoom failed",
      { roomId: roomIdParam, mutation: mutationInput },
      e,
    );
    return actionFail(
      "UNKNOWN",
      e instanceof Error ? e.message : "Aktion fehlgeschlagen",
    );
  }
}

/** Overlay may complete transitions without control session (read-only clients). */
export async function completeTransition(
  roomIdParam: string,
): Promise<ActionResult<{ state: MatchState }>> {
  try {
    return applyAndSave(roomIdParam, { type: "transitionComplete" });
  } catch (e) {
    log.error("completeTransition failed", { roomId: roomIdParam }, e);
    return actionFail(
      "UNKNOWN",
      e instanceof Error ? e.message : "Transition fehlgeschlagen",
    );
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
