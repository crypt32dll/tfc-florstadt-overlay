import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { actionLog } from "@/lib/logger.server";
import type { MatchState, RoomRecord } from "@/lib/match/types";
import type { RoomStore } from "./index";

const log = actionLog("supabase-store");

type RoomRow = {
  id: string;
  pin_hash: string;
  state: MatchState;
  updated_at: string;
};

function getAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase Admin Env fehlt");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function rowToRoom(row: RoomRow): RoomRecord {
  return {
    id: row.id,
    pinHash: row.pin_hash,
    state: row.state,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export const supabaseStore: RoomStore = {
  mode: "supabase",
  async create(room) {
    const sb = getAdmin();
    const { error } = await sb.from("rooms").insert({
      id: room.id,
      pin_hash: room.pinHash,
      state: room.state,
      updated_at: new Date(room.updatedAt).toISOString(),
    });
    if (error) {
      log.error("create failed", { roomId: room.id }, error);
      throw error;
    }
  },
  async get(roomId) {
    const sb = getAdmin();
    const { data, error } = await sb
      .from("rooms")
      .select("id,pin_hash,state,updated_at")
      .eq("id", roomId)
      .maybeSingle();
    if (error) {
      log.error("get failed", { roomId }, error);
      throw error;
    }
    if (!data) return null;
    return rowToRoom(data as RoomRow);
  },
  async save(room) {
    const sb = getAdmin();
    const { error } = await sb
      .from("rooms")
      .update({
        pin_hash: room.pinHash,
        state: room.state,
        updated_at: new Date(room.updatedAt).toISOString(),
      })
      .eq("id", room.id);
    if (error) {
      log.error("save failed", { roomId: room.id }, error);
      throw error;
    }
  },
  async saveIfRevision(room, expectedRevision) {
    const sb = getAdmin();
    const { data, error } = await sb
      .from("rooms")
      .update({
        pin_hash: room.pinHash,
        state: room.state,
        updated_at: new Date(room.updatedAt).toISOString(),
      })
      .eq("id", room.id)
      .filter("state->>revision", "eq", String(expectedRevision))
      .select("id");
    if (error) {
      log.error("saveIfRevision failed", { roomId: room.id }, error);
      throw error;
    }
    if (data?.length) return "ok";
    const existing = await supabaseStore.get(room.id);
    if (!existing) return "missing";
    return "conflict";
  },
  async deleteOlderThan(olderThanMs) {
    const sb = getAdmin();
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    const { data, error } = await sb
      .from("rooms")
      .delete()
      .lt("updated_at", cutoff)
      .select("id");
    if (error) {
      log.error("deleteOlderThan failed", error);
      throw error;
    }
    return data?.length ?? 0;
  },
  async countRooms() {
    const sb = getAdmin();
    const { error, count } = await sb
      .from("rooms")
      .select("id", { count: "exact", head: true });
    if (error) {
      log.error("countRooms failed", error);
      throw error;
    }
    return count ?? 0;
  },
};
