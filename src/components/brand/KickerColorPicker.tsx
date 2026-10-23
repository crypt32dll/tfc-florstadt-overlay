"use client";

import { KICKER_COLOR_HEX } from "@/components/overlay/KickerFigure";
import { KICKER_COLORS, type KickerColor } from "@/lib/match/schema";

type Props = {
  value: KickerColor;
  onChange: (color: KickerColor) => void;
  disabled?: boolean;
  label?: string;
};

export function KickerColorPicker({
  value,
  onChange,
  disabled,
  label = "Figurfarbe",
}: Props) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center gap-1.5">
        {KICKER_COLORS.map((color) => {
          const selected = value === color;
          return (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              aria-label={color}
              aria-pressed={selected}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${
                selected
                  ? "scale-110 border-[var(--brand-accent)]"
                  : "border-white/25 hover:border-white/50"
              }`}
              style={{ backgroundColor: KICKER_COLOR_HEX[color] }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
