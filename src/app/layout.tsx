import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TFC Florstadt Stream Overlay",
  description:
    "Twitch/OBS Overlay für den Tischfußball Club Florstadt – Scoreboard, Timer, Control & Preview Lab.",
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
