"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkControlAuth,
  getRoomState,
  mutateRoom,
  verifyRoomPin,
} from "@/app/actions/rooms";
import { actionErrorMessage } from "@/lib/action/result";
import { getPublicControlPin } from "@/lib/auth/control-pin";
import { clientLog } from "@/lib/logger.client";
import type { MatchState, RoomMutation } from "@/lib/match/types";

const log = clientLog("control");

const CONFLICT_RETRIES = 2;

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

function resolveAutoPin(): string | null {
  return pinFromLocation() ?? getPublicControlPin();
}

export function useControlSession(roomId: string) {
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [autoUnlocking, setAutoUnlocking] = useState(true);
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
    setAutoUnlocking(true);
    let cancelled = false;
    void (async () => {
      const res = await checkControlAuth(roomId);
      if (cancelled) return;
      if (res.ok && res.data.authorized) {
        setAuthorized(true);
        stripPinFromUrl();
        setAutoUnlocking(false);
        return;
      }

      const autoPin = resolveAutoPin();
      if (autoPin && !autoPinTried.current) {
        autoPinTried.current = true;
        setPin(autoPin);
        const ok = await submitPin(autoPin);
        if (cancelled) return;
        setAutoUnlocking(false);
        if (!ok) {
          // Keep PIN field filled for manual retry
        }
        return;
      }

      setAutoUnlocking(false);
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
    autoUnlocking,
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
 * RoomMutation protocol: serial queue, CONFLICT retry, UNAUTHORIZED.
 * Keeps ControlPanel as presentational surface.
 */
export function useRoomMutate(roomId: string, deps: MutateDeps) {
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    message: string;
    mutation: RoomMutation;
  } | null>(null);
  const depsRef = useRef(deps);
  depsRef.current = deps;
  const queueRef = useRef<RoomMutation[]>([]);
  const drainingRef = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const showInfoToast = useCallback((message: string) => setToast(message), []);

  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    setPending(true);

    const { replaceState, refresh, getRevision, onUnauthorized } =
      depsRef.current;

    while (queueRef.current.length > 0) {
      const mutation = queueRef.current.shift();
      if (!mutation) break;

      let attempts = 0;
      let done = false;
      while (!done && attempts <= CONFLICT_RETRIES) {
        try {
          const res = await mutateRoom(roomId, mutation, {
            expectedRevision: getRevision(),
          });
          if (res.ok) {
            setMutationError(null);
            replaceState(res.data.state);
            done = true;
            break;
          }

          if (res.code === "UNAUTHORIZED") {
            onUnauthorized();
            setMutationError(actionErrorMessage(res));
            log.warn("session expired", roomId);
            queueRef.current = [];
            done = true;
            break;
          }

          if (res.code === "CONFLICT") {
            attempts += 1;
            log.warn("revision conflict — retry", {
              roomId,
              attempt: attempts,
              type: mutation.type,
            });
            const fresh = await getRoomState(roomId);
            if (fresh.ok) {
              replaceState(fresh.data.state);
            } else {
              await refresh();
            }
            if (attempts > CONFLICT_RETRIES) {
              showInfoToast(actionErrorMessage(res));
              done = true;
            }
            continue;
          }

          setMutationError(actionErrorMessage(res));
          log.warn("mutation rejected", res.code);
          done = true;
        } catch (err) {
          log.error("mutation network error", err);
          const msg =
            err instanceof Error
              ? err.message
              : "Netzwerkfehler – bitte erneut versuchen.";
          setMutationError(msg);
          done = true;
        }
      }
    }

    drainingRef.current = false;
    setPending(queueRef.current.length > 0);
    if (queueRef.current.length > 0) {
      void drain();
    }
  }, [roomId, showInfoToast]);

  const run = useCallback(
    (mutation: RoomMutation) => {
      queueRef.current.push(mutation);
      setPending(true);
      void drain();
    },
    [drain],
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
