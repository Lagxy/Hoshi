"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteScan, getHistory } from "@/lib/client/api";
import { universeLabel } from "@/lib/scan/constants";
import type { HistoryItemDTO } from "@/lib/scan/serialize";
import { ConditionSummary } from "./ConditionSummary";
import { StatusBadge } from "./StatusBadge";

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryView() {
  const [scans, setScans] = useState<HistoryItemDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await getHistory();
        if (active) setScans(data);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const remove = async (id: string) => {
    const prev = scans;
    setScans((s) => s?.filter((x) => x.id !== id) ?? null);
    try {
      await deleteScan(id);
    } catch {
      setScans(prev ?? null); // restore on failure
    }
  };

  return (
    <section className="border border-line bg-bg-raised/40">
      <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-display text-xs font-bold tracking-[0.2em] text-cyan">
          HISTORY{" "}
          {scans && (
            <span className="text-fg-faint">/ {scans.length}</span>
          )}
        </h2>
        <Link
          href="/"
          className="border border-line-bright px-2.5 py-1 text-xs tracking-wide text-fg-dim transition-colors hover:border-cyan hover:text-cyan"
        >
          + NEW SCAN
        </Link>
      </header>

      {error && (
        <p className="px-4 py-6 text-sm text-loss">
          <span className="font-bold">ERROR · </span>
          {error}
        </p>
      )}

      {!error && scans === null && (
        <p className="px-4 py-10 text-center text-sm text-fg-faint">
          loading history<span className="hoshi-cursor" />
        </p>
      )}

      {scans && scans.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-fg-faint">
          <span className="text-cyan">›</span> no scans yet —{" "}
          <Link href="/" className="text-cyan hover:underline">
            run your first scan
          </Link>
        </p>
      )}

      {scans && scans.length > 0 && (
        <ul className="divide-y divide-line">
          {scans.map((scan) => (
            <li
              key={scan.id}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-cyan/5"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <StatusBadge status={scan.status} />
                  <span className="text-fg-dim tabular-nums">
                    {when(scan.createdAt)}
                  </span>
                  <span className="text-fg-faint">·</span>
                  <span className="text-fg-dim">
                    {universeLabel(scan.universeSize)}
                  </span>
                  <span className="text-fg-faint">·</span>
                  <span className="text-cyan tabular-nums">
                    {scan.matchedCount.toLocaleString()} matched
                  </span>
                </div>

                <ConditionSummary
                  conditions={scan.conditions}
                  logic={scan.logic}
                />

                {scan.errorMessage && (
                  <p className="text-[11px] text-loss/80">
                    {scan.errorMessage}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 text-xs">
                <Link
                  href={`/?from=${scan.id}`}
                  title="Copy these rules into the screener to tweak & re-run"
                  className="border border-line-bright px-2 py-0.5 text-fg-dim transition-colors hover:border-cyan hover:text-cyan"
                >
                  COPY
                </Link>
                <Link
                  href={`/history/${scan.id}`}
                  title="View this saved scan's results"
                  className="border border-line-bright px-2 py-0.5 text-fg-dim transition-colors hover:border-cyan hover:text-cyan"
                >
                  VIEW
                </Link>
                <button
                  type="button"
                  onClick={() => remove(scan.id)}
                  className="px-1.5 py-0.5 text-fg-faint transition-colors hover:text-loss"
                  aria-label="Delete scan"
                  title="Delete this scan"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
