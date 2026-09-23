import type { MatchState, RoomRecord } from "@/lib/match/types";

/** Result of optimistic concurrency at the RoomStore persistence seam. */
export type SaveIfRevisionResult = "ok" | "conflict" | "missing";

export type RoomStore = {
  create(room: RoomRecord): Promise<void>;
  get(roomId: string): Promise<RoomRecord | null>;
  save(room: RoomRecord): Promise<void>;
  /**
   * Persist only if stored MatchState.revision === expectedRevision.
   * Closes the check-then-act race between Control and Overlay writers.
   */
  saveIfRevision(
    room: RoomRecord,
    expectedRevision: number,
  ): Promise<SaveIfRevisionResult>;
  deleteOlderThan(olderThanMs: number): Promise<number>;
  /** Lightweight read used by keep-alive cron to touch Supabase / count rooms. */
  countRooms(): Promise<number>;
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
  async saveIfRevision(room, expectedRevision) {
    const cur = getGlobal().rooms.get(room.id);
    if (!cur) return "missing";
    if (cur.state.revision !== expectedRevision) return "conflict";
    getGlobal().rooms.set(room.id, room);
    return "ok";
  },
  async deleteOlderThan(olderThanMs) {
    const cutoff = Date.now() - olderThanMs;
    let n = 0;
    for (const [id, room] of getGlobal().rooms) {
      if (room.updatedAt < cutoff) {
        getGlobal().rooms.delete(id);
        n += 1;
      }
    }
    return n;
  },
  async countRooms() {
    return getGlobal().rooms.size;
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
