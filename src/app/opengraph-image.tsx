import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "TFC Florstadt Stream Overlay – Scoreboard für Twitch und OBS";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const [logoData, displayFont, bodyFont] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/icons/icon-512.png")),
    readFile(
      join(process.cwd(), "node_modules/@fontsource/teko/files/teko-latin-600-normal.woff"),
    ),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/open-sans/files/open-sans-latin-400-normal.woff",
      ),
    ),
  ]);

  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(165deg, #05080f 0%, #0b1220 45%, #071018 100%)",
          color: "#f4f7fb",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "-40px",
            width: "520px",
            height: "520px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(6,147,227,0.45) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            right: "-60px",
            width: "480px",
            height: "480px",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(6,147,227,0.28) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <img
            src={logoSrc}
            width={112}
            height={112}
            alt=""
            style={{ borderRadius: "24px" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div
              style={{
                fontFamily: "Open Sans",
                fontSize: 22,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#0693e3",
              }}
            >
              Tischfußball Club Florstadt
            </div>
            <div
              style={{
                fontFamily: "Teko",
                fontSize: 72,
                lineHeight: 1,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Stream Overlay
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: 820,
          }}
        >
          <div
            style={{
              fontFamily: "Open Sans",
              fontSize: 30,
              lineHeight: 1.35,
              color: "rgba(244,247,251,0.78)",
            }}
          >
            Scoreboard, Timer und Screens für Twitch & OBS — Steuerung per Handy.
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              fontFamily: "Open Sans",
              fontSize: 20,
              color: "rgba(244,247,251,0.55)",
            }}
          >
            <span>Preview Lab</span>
            <span>·</span>
            <span>Control</span>
            <span>·</span>
            <span>Overlay 1920×1080</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Teko",
          data: displayFont,
          style: "normal",
          weight: 600,
        },
        {
          name: "Open Sans",
          data: bodyFont,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
