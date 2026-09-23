"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRoomState } from "@/app/actions/rooms";
import type { MatchState } from "@/lib/match/types";
import {
  createBrowserSupabase,
  isSupabaseBrowserEnabled,
} from "@/lib/supabase/browser";

export function useRoomState(roomId: string, initialState: MatchState) {
  const [state, setState] = useState<MatchState>(initialState);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revisionRef = useRef(initialState.revision);

  const applyRemote = useCallback((next: MatchState) => {
    if (next.revision <= revisionRef.current) return;
    revisionRef.current = next.revision;
    setState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let channel: ReturnType<
      NonNullable<ReturnType<typeof createBrowserSupabase>>["channel"]
    > | null = null;

    async function boot() {
      if (isSupabaseBrowserEnabled()) {
        const sb = createBrowserSupabase();
        if (sb) {
          channel = sb
            .channel(`room:${roomId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "rooms",
                filter: `id=eq.${roomId}`,
              },
              (payload) => {
                const row = payload.new as { state?: MatchState } | null;
                if (row?.state) applyRemote(row.state);
              },
            )
            .subscribe((status) => {
              if (!cancelled) {
                setConnected(status === "SUBSCRIBED");
              }
            });
          return;
        }
      }

      // Memory / fallback: poll
      setConnected(true);
      pollTimer = setInterval(async () => {
        const res = await getRoomState(roomId);
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setError(null);
        applyRemote(res.data.state);
      }, 400);
    }

    void boot();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (channel) {
        const sb = createBrowserSupabase();
        void sb?.removeChannel(channel);
      }
    };
  }, [roomId, applyRemote]);

  return { state, setState: applyRemote, connected, error };
}
