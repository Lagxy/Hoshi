"use client";

import type { Logic } from "@/lib/scan/types";

const OPTIONS: { value: Logic; label: string; hint: string }[] = [
  { value: "AND", label: "AND", hint: "match ALL" },
  { value: "OR", label: "OR", hint: "match ANY" },
];

export function LogicToggle({
  value,
  onChange,
  disabled,
}: {
  value: Logic;
  onChange: (value: Logic) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-px overflow-hidden rounded-sm border border-line bg-line">
      {OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center px-4 py-1.5 transition-colors disabled:opacity-40 ${
              active
                ? "bg-cyan/20 text-cyan"
                : "bg-bg-raised text-fg-dim hover:text-fg"
            }`}
          >
            <span className="font-display text-xs font-bold tracking-[0.15em]">
              {option.label}
            </span>
            <span
              className={`text-[10px] ${active ? "text-cyan/80" : "text-fg-dim"}`}
            >
              {option.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}
