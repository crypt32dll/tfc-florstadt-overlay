"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRoomState } from "@/app/actions/rooms";
import type { MatchState } from "@/lib/match/types";
import { clientLog } from "@/lib/logger.client";
import {
  createBrowserSupabase,
  isSupabaseBrowserEnabled,
} from "@/lib/supabase/browser";

const log = clientLog("room-state");

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

  /** Force-replace local state (e.g. after CONFLICT resync). */
  const replaceState = useCallback((next: MatchState) => {
    revisionRef.current = next.revision;
    setState(next);
  }, []);

  const refresh = useCallback(async () => {
    const res = await getRoomState(roomId);
    if (!res.ok) {
      setError(res.error);
      setConnected(false);
      return null;
    }
    setError(null);
    setConnected(true);
    replaceState(res.data.state);
    return res.data.state;
  }, [roomId, replaceState]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let channel: ReturnType<
      NonNullable<ReturnType<typeof createBrowserSupabase>>["channel"]
    > | null = null;

    async function pollOnce() {
      try {
        const res = await getRoomState(roomId);
        if (cancelled) return;
        if (!res.ok) {
          setError(res.error);
          setConnected(false);
          log.warn("poll failed", res.error);
          return;
        }
        setError(null);
        setConnected(true);
        applyRemote(res.data.state);
      } catch (e) {
        if (!cancelled) {
          log.error("poll crashed", e);
          setConnected(false);
          setError(
            e instanceof Error ? e.message : "Polling fehlgeschlagen",
          );
        }
      }
    }

    const sb = isSupabaseBrowserEnabled() ? createBrowserSupabase() : null;

    async function boot() {
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
              if (row?.state) {
                setConnected(true);
                setError(null);
                applyRemote(row.state);
              }
            },
          )
          .subscribe((status) => {
            if (cancelled) return;
            if (status === "SUBSCRIBED") {
              setConnected(true);
              setError(null);
              return;
            }
            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              setConnected(false);
              log.warn("realtime status", status, roomId);
              if (!pollTimer) {
                pollTimer = setInterval(() => {
                  void pollOnce();
                }, 1500);
              }
            }
          });
        return;
      }

      setConnected(true);
      pollTimer = setInterval(() => {
        void pollOnce();
      }, 400);
    }

    void boot();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (channel && sb) {
        void sb.removeChannel(channel);
      }
    };
  }, [roomId, applyRemote]);

  return {
    state,
    setState: applyRemote,
    replaceState,
    refresh,
    connected,
    error,
  };
}
