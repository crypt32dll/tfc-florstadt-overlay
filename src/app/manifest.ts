import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TFC Florstadt Stream Overlay",
    short_name: "TFC Overlay",
    description:
      "Twitch/OBS Overlay für den Tischfußball Club Florstadt – Scoreboard, Timer, Control & Preview Lab.",
    start_url: "/",
    display: "browser",
    background_color: "#05080f",
    theme_color: "#0693e3",
    lang: "de",
    icons: [
      {
        src: "/brand/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
