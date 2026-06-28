"use client";

import { motion } from "motion/react";
import { formatEta } from "@/lib/format";
import type { ScanStateDTO } from "@/lib/scan/serialize";

export function ProgressPanel({
  state,
  onCancel,
  cancelling,
}: {
  state: ScanStateDTO;
  onCancel: () => void;
  cancelling?: boolean;
}) {
  const hasTotal = state.progressTotal > 0;
  const pct = hasTotal
    ? Math.min(100, Math.round((state.progressCurrent / state.progressTotal) * 100))
    : 0;

  return (
    <section className="border border-cyan/30 bg-bg-raised/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-cyan hoshi-pulse" />
          <span className="font-display text-xs font-bold tracking-[0.18em] text-cyan">
            {state.stage ?? state.status}
          </span>
          <span className="hoshi-cursor" />
        </div>
        <div className="flex items-center gap-4 text-xs text-fg-dim">
          <span className="tabular-nums">
            {state.progressCurrent.toLocaleString()}
            {hasTotal ? ` / ${state.progressTotal.toLocaleString()}` : ""}
          </span>
          {state.etaSeconds != null && state.etaSeconds > 0 && (
            <span className="tabular-nums">
              ETA {formatEta(state.etaSeconds)}
            </span>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="border border-loss/40 px-2.5 py-1 text-loss transition-colors hover:bg-loss/10 disabled:opacity-50"
          >
            {cancelling ? "CANCELLING…" : "CANCEL"}
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden bg-bg-sunken">
        {hasTotal ? (
          <motion.div
            className="h-full bg-cyan"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        ) : (
          <div className="hoshi-pulse h-full w-full bg-cyan/40" />
        )}
      </div>
    </section>
  );
}
