import { MIN_INTERVAL_MS } from "@/lib/coingecko/rateLimiter";

/** Seconds to fetch `uncachedCount` Stage-2 detail calls at the paced rate. */
export function estimateStage2Seconds(uncachedCount: number): number {
  return Math.ceil((uncachedCount * MIN_INTERVAL_MS) / 1000);
}
