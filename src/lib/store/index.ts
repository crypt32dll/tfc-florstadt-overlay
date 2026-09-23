import type { MatchState, RoomRecord } from "@/lib/match/types";

export type RoomStore = {
  create(room: RoomRecord): Promise<void>;
  get(roomId: string): Promise<RoomRecord | null>;
  save(room: RoomRecord): Promise<void>;
  mode: "memory" | "supabase";
};

type GlobalStore = {
  rooms: Map<string, RoomRecord>;
};

function getGlobal(): GlobalStore {
  const g = globalThis as typeof globalThis & {
    __tfcRoomStore?: GlobalStore;
  };
  if (!g.__tfcRoomStore) {
    g.__tfcRoomStore = { rooms: new Map() };
  }
  return g.__tfcRoomStore;
}

export const memoryStore: RoomStore = {
  mode: "memory",
  async create(room) {
    getGlobal().rooms.set(room.id, room);
  },
  async get(roomId) {
    return getGlobal().rooms.get(roomId) ?? null;
  },
  async save(room) {
    getGlobal().rooms.set(room.id, room);
  },
};

export function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function getStore(): Promise<RoomStore> {
  if (!hasSupabaseConfig()) {
    return memoryStore;
  }
  const { supabaseStore } = await import("./supabase-store");
  return supabaseStore;
}

export type { MatchState, RoomRecord };
