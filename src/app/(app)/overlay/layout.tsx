import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TFC Overlay",
  robots: { index: false, follow: false },
};

/**
 * Transparent stage for OBS Browser Source.
 * Inline CSS applies on first paint (no wait for client JS) so OBS Custom CSS
 * is unnecessary — CEF composites page alpha when html/body are transparent.
 */
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          background-color: rgba(0, 0, 0, 0) !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
      <div className="overlay-stage m-0 min-h-screen overflow-hidden bg-transparent p-0">
        {children}
      </div>
    </>
  );
}
