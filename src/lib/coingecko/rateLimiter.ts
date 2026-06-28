/**
 * Process-wide request pacer for the CoinGecko Demo tier (100 req/min hard cap).
 *
 * We target ~85 req/min for safety margin: one slot every ~706ms. Slots are handed
 * out in order even under concurrency, so N parallel callers still drain at the
 * paced rate. Pinned to globalThis so dev HMR doesn't spin up a second pacer that
 * would double the real request rate.
 */

export const TARGET_RPM = 85;
export const MIN_INTERVAL_MS = Math.ceil(60_000 / TARGET_RPM); // ~706ms

const globalForLimiter = globalThis as unknown as {
  __hoshiRateLimiter?: { nextSlot: number };
};

const state =
  globalForLimiter.__hoshiRateLimiter ??
  (globalForLimiter.__hoshiRateLimiter = { nextSlot: 0 });

/** Abortable sleep — rejects with an AbortError if `signal` fires first. */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Wait until this caller's paced slot is due. Call once per outbound request. */
export async function acquireSlot(signal?: AbortSignal): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, state.nextSlot - now);
  // Reserve this slot; the next caller is spaced one interval further out.
  state.nextSlot = Math.max(now, state.nextSlot) + MIN_INTERVAL_MS;
  if (wait > 0) await sleep(wait, signal);
}

/**
 * Push the next available slot out by `ms` (used after a 429 to back the whole
 * process off, not just the failing request).
 */
export function penalize(ms: number): void {
  state.nextSlot = Math.max(state.nextSlot, Date.now() + ms);
}
