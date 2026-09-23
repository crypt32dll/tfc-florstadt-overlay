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

/** Manifest when installing / launching from a Control room (QR → phone). */
export function controlManifest(roomId: string): MetadataRoute.Manifest {
  const startUrl = `/control/${roomId}`;
  return {
    id: startUrl,
    name: "TFC Florstadt Control",
    short_name: "TFC Control",
    description: "Match-Control für Tischfußball Club Florstadt Stream Overlay",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05080f",
    theme_color: "#0693e3",
    lang: "de",
    icons: ICONS,
  };
}

/** Site-wide manifest (create-room home). Prefer installing from Control after QR. */
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

const ROOM_ID_RE = /^[a-z0-9]{4,32}$/i;

export function isValidRoomId(roomId: string): boolean {
  return ROOM_ID_RE.test(roomId);
}
