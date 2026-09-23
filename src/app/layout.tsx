import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TFC Florstadt Stream Overlay",
  description:
    "Twitch/OBS Overlay für den Tischfußball Club Florstadt – Scoreboard, Timer, Control & Preview Lab.",
  icons: {
    icon: [
      { url: "/brand/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/icons/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/brand/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: "/brand/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/brand/icons/icon-32.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Teko:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
