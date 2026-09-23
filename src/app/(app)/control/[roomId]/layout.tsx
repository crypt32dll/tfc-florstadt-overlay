import type { Metadata } from "next";
import { isValidRoomId } from "@/lib/pwa/manifest";

type Props = {
  children: React.ReactNode;
  params: Promise<{ roomId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomId } = await params;
  const safe = isValidRoomId(roomId) ? roomId : null;

  return {
    title: "TFC Control",
    applicationName: "TFC Control",
    description:
      "Match-Control für Tischfußball Club Florstadt – Tore, Timer, Screens.",
    manifest: safe ? `/api/manifest/control/${safe}` : undefined,
    appleWebApp: {
      capable: true,
      title: "TFC Control",
      statusBarStyle: "black-translucent",
    },
  };
}

export default async function ControlLayout({ children }: Props) {
  return children;
}
