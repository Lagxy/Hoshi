/** Cache TTLs and freshness helpers. */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** Stage-1 markets snapshot — short window so scans see near-current prices. */
export const MARKETS_TTL_MS = 15 * MINUTE_MS;

/** Stage-2 classification (genesis_date + categories) — near-static, long window. */
export const DETAIL_TTL_MS = 7 * DAY_MS;

/** Category list for the multi-select — rarely changes. */
export const CATEGORIES_TTL_MS = 24 * HOUR_MS;

/** Cutoff Date such that anything fetched at/after it is still fresh. */
export function freshnessCutoff(ttlMs: number, now: number = Date.now()): Date {
  return new Date(now - ttlMs);
}

/** True when `fetchedAt` is within `ttlMs` of now. */
export function isFresh(
  fetchedAt: Date,
  ttlMs: number,
  now: number = Date.now(),
): boolean {
  return now - fetchedAt.getTime() < ttlMs;
}
