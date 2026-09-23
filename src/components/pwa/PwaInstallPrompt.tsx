"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";
import {
  isIosSafari,
  isStandaloneDisplay,
  PWA_INSTALL_DISMISSED_KEY,
  PWA_INSTALLED_KEY,
} from "@/lib/pwa/manifest";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // private mode / quota
  }
}

function isAndroidChrome(): boolean {
  const ua = navigator.userAgent;
  return (
    /Android/i.test(ua) && /Chrome/i.test(ua) && !/EdgA|OPR|Samsung/i.test(ua)
  );
}

async function detectInstalledPwa(): Promise<boolean> {
  if (isStandaloneDisplay()) return true;

  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<
      { platform: string; url?: string }[]
    >;
  };
  if (typeof nav.getInstalledRelatedApps === "function") {
    try {
      const apps = await nav.getInstalledRelatedApps();
      if (apps.some((a) => a.platform === "webapp" || Boolean(a.url))) {
        return true;
      }
    } catch {
      // unsupported / permission
    }
  }

  return false;
}

/**
 * Install hint after QR → Control.
 * Shows only when install is possible (Chrome BIP or iOS A2HS).
 * Already-installed is detected automatically — no manual button.
 */
export function PwaInstallPrompt() {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const bipSeenRef = useRef(false);

  const dismiss = useCallback((permanent: boolean) => {
    if (permanent) writeFlag(PWA_INSTALL_DISMISSED_KEY);
    setOpen(false);
  }, []);

  const markInstalled = useCallback(() => {
    writeFlag(PWA_INSTALLED_KEY);
    setOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let decideTimer: number | undefined;

    if (isStandaloneDisplay()) {
      writeFlag(PWA_INSTALLED_KEY);
      return;
    }
    if (readFlag(PWA_INSTALL_DISMISSED_KEY) || readFlag(PWA_INSTALLED_KEY)) {
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      bipSeenRef.current = true;
      deferredRef.current = e as BeforeInstallPromptEvent;
      if (!cancelled) {
        setCanPrompt(true);
        setOpen(true);
      }
    };

    const onInstalled = () => {
      markInstalled();
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    void (async () => {
      if (await detectInstalledPwa()) {
        if (!cancelled) markInstalled();
        return;
      }
      if (cancelled) return;

      const onIos = isIosSafari();
      setIos(onIos);

      decideTimer = window.setTimeout(() => {
        void detectInstalledPwa().then((installed) => {
          if (cancelled) return;
          if (installed) {
            markInstalled();
            return;
          }
          if (onIos || bipSeenRef.current) {
            setOpen(true);
            return;
          }
          // Android Chrome without BIP ≈ already installed or not installable
          if (isAndroidChrome()) {
            markInstalled();
          }
        });
      }, 1200);
    })();

    return () => {
      cancelled = true;
      if (decideTimer) window.clearTimeout(decideTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [markInstalled]);

  const onInstallClick = async () => {
    const deferred = deferredRef.current;
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferredRef.current = null;
      setCanPrompt(false);
      if (outcome === "accepted") {
        markInstalled();
      } else {
        dismiss(true);
      }
    } catch {
      dismiss(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div className="glass-panel-strong w-full max-w-md space-y-4 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandMark size={96} className="drop-shadow-lg" />
          <h2
            id="pwa-install-title"
            className="font-display text-3xl tracking-wide text-white uppercase"
          >
            Als App installieren
          </h2>
          <p className="text-sm text-muted">
            Einmal installieren – ein Icon für alle Matches. Ob der QR danach
            die App öffnet, entscheidet das Handy (Android oft, iPhone bleibt im
            Safari).
          </p>
        </div>

        {ios ? (
          <ol className="list-decimal space-y-2 rounded-[var(--radius-control)] border border-white/10 bg-black/25 px-4 py-3 pl-8 text-left text-sm text-white/85">
            <li>
              Tippe auf <strong className="text-white">Teilen</strong> (Quadrat
              mit Pfeil)
            </li>
            <li>
              Wähle <strong className="text-white">Zum Home-Bildschirm</strong>
            </li>
            <li>
              Bestätige mit <strong className="text-white">Hinzufügen</strong>
            </li>
          </ol>
        ) : (
          <p className="rounded-[var(--radius-control)] border border-white/10 bg-black/25 px-3 py-2 text-center text-sm text-white/80">
            Mit einem Tip installierst du TFC Control wie eine App.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {canPrompt && !ios && (
            <button
              type="button"
              className="btn btn-primary w-full text-xl"
              onClick={() => void onInstallClick()}
            >
              Jetzt installieren
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost w-full text-base text-muted"
            onClick={() => dismiss(true)}
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}
