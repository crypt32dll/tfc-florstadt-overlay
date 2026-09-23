import type { Metadata } from "next";
import { Open_Sans, Teko } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

const teko = Teko({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-teko",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TFC Florstadt Stream Overlay",
  description:
    "Twitch/OBS Overlay für den Tischfußball Club Florstadt – Scoreboard, Timer, Control & Preview Lab.",
  applicationName: "TFC Florstadt Overlay",
  appleWebApp: {
    capable: true,
    title: "TFC Control",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
    <html
      lang="de"
      className={`${openSans.variable} ${teko.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
