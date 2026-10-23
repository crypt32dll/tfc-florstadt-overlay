import type { KickerColor } from "@/lib/match/types";

export const KICKER_COLOR_HEX: Record<KickerColor, string> = {
  black: "#111111",
  white: "#f4f7fb",
  green: "#22c55e",
  blue: "#0693e3",
  red: "#ef4444",
};

type Props = {
  color: KickerColor;
  className?: string;
  size?: number;
};

/** Simple foosball-player silhouette for scorebug / starting soon. */
export function KickerFigure({ color, className = "", size = 28 }: Props) {
  const fill = KICKER_COLOR_HEX[color] ?? KICKER_COLOR_HEX.blue;
  const outline = color === "black" ? "#f4f7fb" : undefined;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 48"
      className={className}
      aria-hidden="true"
    >
      <g
        fill={fill}
        stroke={outline}
        strokeWidth={outline ? 1.5 : undefined}
        paintOrder="stroke fill"
      >
        <circle cx="16" cy="7" r="5" />
        <path d="M10 14h12l2 16h-4l-1 14h-6l-1-14h-4z" />
        <path d="M6 18h4l2 8H8zM22 18h4l-2 8h-4z" />
      </g>
    </svg>
  );
}
