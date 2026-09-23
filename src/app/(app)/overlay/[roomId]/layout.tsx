import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TFC Overlay",
  robots: { index: false, follow: false },
};

export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overlay-stage m-0 min-h-screen overflow-hidden bg-transparent p-0">
      {children}
    </div>
  );
}
