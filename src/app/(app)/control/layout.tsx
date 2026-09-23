import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TFC Control",
  applicationName: "TFC Control",
  description:
    "Match-Control für Tischfußball Club Florstadt – Tore, Timer, Screens. Ein Icon für alle Räume.",
  manifest: "/api/manifest/control",
  appleWebApp: {
    capable: true,
    title: "TFC Control",
    statusBarStyle: "black-translucent",
  },
};

export default function ControlSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
