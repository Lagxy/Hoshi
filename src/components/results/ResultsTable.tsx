"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { ColumnValue, ResultRow } from "@/lib/scan/columns";
import { formatByUnit, formatPrice, formatUsd } from "@/lib/format";
import type { ScanResultsDTO } from "@/lib/scan/serialize";

type SortDir = "asc" | "desc";

const ANCHORS = [
  { key: "name", label: "Token", align: "left" as const },
  { key: "price", label: "Price", align: "right" as const },
  { key: "mcap", label: "Market Cap", align: "right" as const },
];

function sortValue(row: ResultRow, key: string): number | string {
  if (key === "name") return row.name.toLowerCase();
  if (key === "price") return row.current_price ?? -Infinity;
  if (key === "mcap") return row.market_cap ?? -Infinity;
  const v = row.values[key];
  if (Array.isArray(v)) return v.length;
  return v ?? -Infinity;
}

function cellText(unit: string, value: ColumnValue): string {
  return formatByUnit(unit, value);
}

export function ResultsTable({ results }: { results: ScanResultsDTO }) {
  const { columns, rows, id } = results;
  const [sortKey, setSortKey] = useState("mcap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      let cmp: number;
      if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv);
      } else {
        cmp = (av as number) - (bv as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

  const sortMark = (key: string) =>
    key === sortKey ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <section className="border border-line bg-bg-raised/40">
      <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-display text-xs font-bold tracking-[0.2em] text-cyan">
          RESULTS{" "}
          <span className="text-fg-faint">/ {rows.length.toLocaleString()}</span>
        </h2>
        {rows.length > 0 && (
          <a
            href={`/api/scan/${id}/export`}
            className="border border-line-bright px-2.5 py-1 text-xs tracking-wide text-fg-dim transition-colors hover:border-cyan hover:text-cyan"
          >
            ↓ EXPORT CSV
          </a>
        )}
      </header>

      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-fg-faint">
          <span className="text-cyan">›</span> no tokens matched these filters
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-line bg-bg-sunken text-fg-dim">
                {ANCHORS.map((a) => (
                  <th
                    key={a.key}
                    onClick={() => toggleSort(a.key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-medium tracking-wide hover:text-cyan ${
                      a.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {a.label}
                    {sortMark(a.key)}
                  </th>
                ))}
                {columns.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-right font-medium tracking-wide hover:text-cyan"
                  >
                    {c.label}
                    {sortMark(c.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, delay: Math.min(i, 40) * 0.012 }}
                  className="border-b border-line/60 hover:bg-cyan/5"
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="text-fg">{row.name}</span>{" "}
                    <span className="text-fg-faint uppercase">{row.symbol}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-fg">
                    {formatPrice(row.current_price)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-fg-dim">
                    {formatUsd(row.market_cap)}
                  </td>
                  {columns.map((c) => {
                    const value = row.values[c.key] ?? null;
                    const text = cellText(c.unit, value);
                    const tone =
                      c.unit === "percent" && typeof value === "number"
                        ? value > 0
                          ? "text-gain"
                          : value < 0
                            ? "text-loss"
                            : "text-fg-dim"
                        : "text-fg-dim";
                    return (
                      <td
                        key={c.key}
                        className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${tone}`}
                      >
                        {text}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
