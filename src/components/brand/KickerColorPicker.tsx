"use client";

import { KickerFigure } from "@/components/overlay/KickerFigure";
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
      <div className="flex items-center gap-1">
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
              className={`flex h-11 w-9 items-center justify-center rounded-[var(--radius-control)] border transition-transform ${
                selected
                  ? "scale-105 border-[var(--brand-accent)] bg-[var(--brand-accent)]/15"
                  : "border-transparent hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <KickerFigure color={color} size={28} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
