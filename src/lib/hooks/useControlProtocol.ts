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

function pinFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("pin");
  if (!raw) return null;
  const clean = raw.replace(/\D/g, "");
  return clean.length >= 4 && clean.length <= 6 ? clean : null;
}

function stripPinFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("pin")) return;
  url.searchParams.delete("pin");
  window.history.replaceState({}, "", url.pathname + url.search + url.hash);
}

export function useControlSession(roomId: string) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const pinSubmitting = useRef(false);
  const autoPinTried = useRef(false);

  const submitPin = useCallback(
    async (rawPin: string) => {
      if (pinSubmitting.current) return false;

      const cleanPin = rawPin.replace(/\D/g, "");
      if (cleanPin.length < 4 || cleanPin.length > 6) {
        setAuthError("PIN muss 4–6 Ziffern haben.");
        return false;
      }

      pinSubmitting.current = true;
      setPinLoading(true);
      setAuthError(null);
      try {
        const res = await verifyRoomPin({ roomId, pin: cleanPin });
        if (!res.ok) {
          setAuthError(actionErrorMessage(res));
          log.warn("PIN failed", res.code);
          return false;
        }
        setAuthorized(true);
        setPin("");
        stripPinFromUrl();
        return true;
      } catch (err) {
        log.error("PIN network error", err);
        setAuthError(
          err instanceof Error
            ? err.message
            : "Verbindung fehlgeschlagen. Bitte WLAN/URL prüfen und erneut versuchen.",
        );
        return false;
      } finally {
        pinSubmitting.current = false;
        setPinLoading(false);
      }
    },
    [roomId],
  );

  useEffect(() => {
    autoPinTried.current = false;
    let cancelled = false;
    void (async () => {
      const res = await checkControlAuth(roomId);
      if (cancelled) return;
      if (res.ok && res.data.authorized) {
        setAuthorized(true);
        stripPinFromUrl();
        return;
      }

      const fromQuery = pinFromLocation();
      if (fromQuery && !autoPinTried.current) {
        autoPinTried.current = true;
        setPin(fromQuery);
        await submitPin(fromQuery);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, submitPin]);

  const onPinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await submitPin(pin);
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
  const [pendingConfirm, setPendingConfirm] = useState<{
    message: string;
    mutation: RoomMutation;
  } | null>(null);
  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showInfoToast = useCallback((message: string) => setToast(message), []);

  const run = useCallback(
    (mutation: RoomMutation) => {
      startTransition(async () => {
        const { replaceState, refresh, getRevision, onUnauthorized } =
          depsRef.current;
        try {
          const res = await mutateRoom(roomId, mutation, {
            expectedRevision: getRevision(),
          });
          if (!res.ok) {
            if (res.code === "UNAUTHORIZED") {
              onUnauthorized();
              setMutationError(actionErrorMessage(res));
              log.warn("session expired", roomId);
            } else if (res.code === "CONFLICT") {
              showInfoToast(actionErrorMessage(res));
              log.warn("revision conflict", roomId);
              const fresh = await getRoomState(roomId);
              if (fresh.ok) {
                replaceState(fresh.data.state);
              } else {
                await refresh();
              }
            } else {
              setMutationError(actionErrorMessage(res));
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
        }
      });
    },
    [roomId, showInfoToast],
  );

  const confirmRun = useCallback((message: string, mutation: RoomMutation) => {
    setPendingConfirm({ message, mutation });
  }, []);

  const acceptConfirm = useCallback(() => {
    if (!pendingConfirm) return;
    const { mutation } = pendingConfirm;
    setPendingConfirm(null);
    run(mutation);
  }, [pendingConfirm, run]);

  const dismissConfirm = useCallback(() => {
    setPendingConfirm(null);
  }, []);

  return {
    run,
    confirmRun,
    acceptConfirm,
    dismissConfirm,
    pendingConfirm,
    pending,
    toast,
    mutationError,
    setMutationError,
  };
}
