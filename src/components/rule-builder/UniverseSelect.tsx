"use client";

import { UNIVERSE_OPTIONS } from "@/lib/scan/constants";

export function UniverseSelect({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-px overflow-hidden rounded-sm border border-line bg-line">
      {UNIVERSE_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-xs tracking-wide transition-colors disabled:opacity-40 ${
              active
                ? "bg-cyan/15 text-cyan"
                : "bg-bg-raised text-fg-dim hover:text-fg"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
