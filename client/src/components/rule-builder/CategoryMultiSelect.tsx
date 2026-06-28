"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoryOption } from "@/lib/client/api";

export function CategoryMultiSelect({
  selected,
  options,
  loading,
  disabled,
  onChange,
}: {
  selected: string[];
  options: CategoryOption[];
  loading?: boolean;
  disabled?: boolean;
  onChange: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selectedSet = new Set(selected);
  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = (name: string) => {
    const next = new Set(selectedSet);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange([...next]);
  };

  return (
    <div ref={ref} className="relative min-w-44">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border border-line bg-bg-sunken px-2 py-1.5 text-xs text-fg hover:border-line-bright disabled:opacity-40"
      >
        <span className={selected.length ? "text-cyan" : "text-fg-dim"}>
          {loading
            ? "loading…"
            : selected.length
              ? `${selected.length} selected`
              : "any category"}
        </span>
        <span className="text-fg-faint">▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-72 overflow-hidden border border-line-bright bg-bg-overlay shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter categories…"
            className="w-full border-b border-line bg-bg-sunken px-2 py-1.5 text-xs text-fg placeholder:text-fg-faint focus:outline-none"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-xs text-fg-faint">no matches</p>
            )}
            {filtered.map((o) => {
              const on = selectedSet.has(o.name);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.name)}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-cyan/10"
                >
                  <span
                    className={`grid size-3.5 place-items-center border text-[9px] ${
                      on
                        ? "border-cyan bg-cyan/20 text-cyan"
                        : "border-line-bright text-transparent"
                    }`}
                  >
                    ✕
                  </span>
                  <span className={on ? "text-cyan" : "text-fg-dim"}>
                    {o.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
