import type { MetadataRoute } from "next";

const ICONS: MetadataRoute.Manifest["icons"] = [
  {
    src: "/brand/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/brand/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/brand/icons/apple-touch-icon.png",
    sizes: "180x180",
    type: "image/png",
  },
];

/**
 * One Control PWA for all rooms.
 * QR deep-links stay `/control/{roomId}` (in scope); the icon opens `/control`
 * which forwards to the last room. launch_handler navigates an existing window
 * when a new room URL is opened (Android Chrome).
 */
export function controlManifest(): MetadataRoute.Manifest & {
  launch_handler?: { client_mode: string | string[] };
  related_applications?: { platform: string; url: string }[];
  prefer_related_applications?: boolean;
} {
  return {
    id: "/control",
    name: "TFC Florstadt Control",
    short_name: "TFC Control",
    description:
      "Match-Control für Tischfußball Club Florstadt – ein Icon für alle Räume",
    start_url: "/control",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05080f",
    theme_color: "#0693e3",
    lang: "de",
    icons: ICONS,
    launch_handler: {
      client_mode: ["navigate-existing", "auto"],
    },
    // Enables navigator.getInstalledRelatedApps() in Chromium
    related_applications: [
      {
        platform: "webapp",
        url: "/api/manifest/control",
      },
    ],
    prefer_related_applications: false,
  };
}

/** Site-wide manifest (create-room home). Prefer installing Control from /control. */
export function siteManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TFC Florstadt Overlay",
    short_name: "TFC Overlay",
    description: "Raum erstellen und Overlay für Tischfußball Club Florstadt",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#05080f",
    theme_color: "#0693e3",
    lang: "de",
    icons: ICONS,
  };
}

export const CONTROL_ROOM_STORAGE_KEY = "tfc:last-control-room";
/** User dismissed the install hint or confirmed the PWA is already installed. */
export const PWA_INSTALL_DISMISSED_KEY = "tfc:pwa-install-dismissed";
export const PWA_INSTALLED_KEY = "tfc:pwa-installed";

const ROOM_ID_RE = /^[a-z0-9]{4,32}$/i;

export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_RE.test(roomId);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

export function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notOther = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && notOther;
}

export function readLastControlRoom(): string | null {
  try {
    const id = window.localStorage.getItem(CONTROL_ROOM_STORAGE_KEY);
    return id && isValidRoomId(id) ? id : null;
  } catch {
    return null;
  }
}
