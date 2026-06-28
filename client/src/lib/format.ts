/** Display formatting (client-safe — no server imports). */

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

export function formatUsd(n: number | null): string {
  if (n == null) return "—";
  return `$${formatCompact(n)}`;
}

export function formatPrice(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1) return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 8 })}`;
}

export function formatPercent(n: number | null): string {
  if (n == null) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function formatRatio(n: number | null): string {
  if (n == null) return "—";
  return `${n.toFixed(2)}×`;
}

export function formatDays(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n).toLocaleString()}d`;
}

/** Format a column cell by its field unit. */
export function formatByUnit(
  unit: string,
  value: number | string[] | null,
): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  switch (unit) {
    case "usd":
      return formatUsd(value);
    case "percent":
      return formatPercent(value);
    case "ratio":
      return formatRatio(value);
    case "days":
      return formatDays(value);
    default:
      return value == null ? "—" : String(value);
  }
}

/** Sign class for percent/number deltas. */
export function deltaTone(n: number | null): "gain" | "loss" | "flat" {
  if (n == null || n === 0) return "flat";
  return n > 0 ? "gain" : "loss";
}

export function formatEta(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
