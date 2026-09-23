import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TFC Florstadt Control",
    short_name: "TFC Control",
    description: "Match-Control für Tischfußball Club Florstadt Stream Overlay",
    start_url: "/",
    display: "standalone",
    background_color: "#05080f",
    theme_color: "#0693e3",
    lang: "de",
    icons: [
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
    ],
  };
}
