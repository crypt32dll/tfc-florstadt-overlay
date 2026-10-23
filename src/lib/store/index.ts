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
  /** Stable OBS master URL resolves to this room (latest created). */
  getLiveRoomId(): Promise<string | null>;
  setLiveRoomId(roomId: string): Promise<void>;
  mode: "memory" | "supabase";
};

type GlobalStore = {
  rooms: Map<string, RoomRecord>;
  liveRoomId: string | null;
};

function getGlobal(): GlobalStore {
  const g = globalThis as typeof globalThis & {
    __tfcRoomStore?: GlobalStore;
  };
  if (!g.__tfcRoomStore) {
    g.__tfcRoomStore = { rooms: new Map(), liveRoomId: null };
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
    const g = getGlobal();
    for (const [id, room] of g.rooms) {
      if (room.updatedAt < cutoff) {
        g.rooms.delete(id);
        if (g.liveRoomId === id) g.liveRoomId = null;
        n += 1;
      }
    }
    return n;
  },
  async countRooms() {
    return getGlobal().rooms.size;
  },
  async getLiveRoomId() {
    return getGlobal().liveRoomId;
  },
  async setLiveRoomId(roomId) {
    getGlobal().liveRoomId = roomId;
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
