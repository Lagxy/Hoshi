/** Universe presets shown in the dashboard. "All" is a sentinel; the funnel pages
 * until CoinGecko runs out of tokens. */
export const ALL_UNIVERSE = 1_000_000;

export const UNIVERSE_OPTIONS = [
  { label: "Top 250", value: 250 },
  { label: "Top 500", value: 500 },
  { label: "Top 1000", value: 1000 },
  { label: "Top 2000", value: 2000 },
  { label: "All (~15k)", value: ALL_UNIVERSE },
] as const;

export function isAllUniverse(n: number): boolean {
  return n >= ALL_UNIVERSE;
}

export function universeLabel(n: number): string {
  return UNIVERSE_OPTIONS.find((o) => o.value === n)?.label ?? `Top ${n}`;
}

export const MARKETS_PER_PAGE = 250;

/** Heuristic: a fresh "all" snapshot is reusable if it holds at least this many rows. */
export const ALL_REUSE_MIN_ROWS = 5000;

export type ScanStatus =
  | "queued"
  | "running_stage1"
  | "running_stage2"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted";
