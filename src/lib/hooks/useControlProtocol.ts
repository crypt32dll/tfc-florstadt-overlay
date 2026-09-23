"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  checkControlAuth,
  getRoomState,
  mutateRoom,
  verifyRoomPin,
} from "@/app/actions/rooms";
import { actionErrorMessage } from "@/lib/action/result";
import { clientLog } from "@/lib/logger.client";
import type { MatchState, RoomMutation } from "@/lib/match/types";

const log = clientLog("control");

export function useControlSession(roomId: string) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const pinSubmitting = useRef(false);

  useEffect(() => {
    void checkControlAuth(roomId).then((res) => {
      if (res.ok) setAuthorized(res.data.authorized);
    });
  }, [roomId]);

  const onPinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pinSubmitting.current || pinLoading) return;

    const cleanPin = pin.replace(/\D/g, "");
    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setAuthError("PIN muss 4–6 Ziffern haben.");
      return;
    }

    pinSubmitting.current = true;
    setPinLoading(true);
    setAuthError(null);
    try {
      const res = await verifyRoomPin({ roomId, pin: cleanPin });
      if (!res.ok) {
        setAuthError(actionErrorMessage(res));
        log.warn("PIN failed", res.code);
        return;
      }
      setAuthorized(true);
      setPin("");
    } catch (err) {
      log.error("PIN network error", err);
      setAuthError(
        err instanceof Error
          ? err.message
          : "Verbindung fehlgeschlagen. Bitte WLAN/URL prüfen und erneut versuchen.",
      );
    } finally {
      pinSubmitting.current = false;
      setPinLoading(false);
    }
  };

  return {
    authorized,
    setAuthorized,
    pin,
    setPin,
    authError,
    setAuthError,
    pinLoading,
    onPinSubmit,
  };
}

type MutateDeps = {
  replaceState: (next: MatchState) => void;
  refresh: () => Promise<MatchState | null>;
  getRevision: () => number;
  onUnauthorized: () => void;
};

/**
 * RoomMutation protocol: revision checks, CONFLICT resync, UNAUTHORIZED.
 * Keeps ControlPanel as presentational surface.
 */
export function useRoomMutate(roomId: string, deps: MutateDeps) {
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const run = useCallback(
    (mutation: RoomMutation, opts?: { skipRevisionCheck?: boolean }) => {
      startTransition(async () => {
        const { replaceState, refresh, getRevision, onUnauthorized } =
          depsRef.current;
        try {
          const res = await mutateRoom(roomId, mutation, {
            expectedRevision: opts?.skipRevisionCheck
              ? undefined
              : getRevision(),
          });
          if (!res.ok) {
            if (res.code === "UNAUTHORIZED") {
              onUnauthorized();
              setMutationError(actionErrorMessage(res));
              log.warn("session expired", roomId);
            } else if (res.code === "CONFLICT") {
              showToast(actionErrorMessage(res));
              log.warn("revision conflict", roomId);
              const fresh = await getRoomState(roomId);
              if (fresh.ok) {
                replaceState(fresh.data.state);
              } else {
                await refresh();
              }
            } else {
              const msg = actionErrorMessage(res);
              setMutationError(msg);
              showToast(msg);
              log.warn("mutation rejected", res.code);
            }
            return;
          }
          setMutationError(null);
          replaceState(res.data.state);
        } catch (err) {
          log.error("mutation network error", err);
          const msg =
            err instanceof Error
              ? err.message
              : "Netzwerkfehler – bitte erneut versuchen.";
          setMutationError(msg);
          showToast(msg);
        }
      });
    },
    [roomId, showToast],
  );

  const confirmRun = useCallback(
    (message: string, mutation: RoomMutation) => {
      if (typeof window !== "undefined" && !window.confirm(message)) return;
      run(mutation);
    },
    [run],
  );

  return {
    run,
    confirmRun,
    pending,
    toast,
    mutationError,
    setMutationError,
  };
}
