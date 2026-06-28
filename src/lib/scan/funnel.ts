import { DETAIL_TTL_MS, MARKETS_TTL_MS, isFresh } from "@/lib/cache";
import {
  CoinGeckoError,
  fetchCoinDetail,
  fetchMarketsPage,
} from "@/lib/coingecko/client";
import * as repo from "@/lib/db/repo";
import type { MarketRowInput } from "@/lib/db/repo";
import {
  ALL_REUSE_MIN_ROWS,
  MARKETS_PER_PAGE,
  isAllUniverse,
} from "./constants";
import { estimateStage2Seconds } from "./estimate";
import { marketRowToToken, marketToRowInput } from "./map";
import type { ScanConfig, TokenData } from "./types";

export interface FunnelHooks {
  signal: AbortSignal;
  isCancelled: () => boolean;
  onStage1: (current: number, total: number, label: string) => Promise<void>;
  onStage2: (
    current: number,
    total: number,
    etaSeconds: number,
  ) => Promise<void>;
}

/** Stage 1: ensure the markets cache covers this universe and is fresh (<15m). */
export async function ensureMarketsFresh(
  config: ScanConfig,
  hooks: FunnelHooks,
): Promise<void> {
  const all = isAllUniverse(config.universeSize);
  const meta = await repo.getMarketsMeta();
  const requiredCount = all ? ALL_REUSE_MIN_ROWS : config.universeSize;

  if (
    meta.newestFetchedAt &&
    isFresh(meta.newestFetchedAt, MARKETS_TTL_MS) &&
    meta.count >= requiredCount
  ) {
    await hooks.onStage1(1, 1, "Stage 1 · markets (cached)");
    return;
  }

  const totalPages = all ? 0 : Math.ceil(config.universeSize / MARKETS_PER_PAGE);
  const fetchedAt = new Date();
  const rows: MarketRowInput[] = [];
  let page = 1;

  for (;;) {
    if (hooks.isCancelled()) return;
    const batch = await fetchMarketsPage(page, MARKETS_PER_PAGE, hooks.signal);
    if (batch.length === 0) break;
    for (const m of batch) rows.push(marketToRowInput(m, fetchedAt));
    const label = all
      ? `Stage 1 · markets ${rows.length}`
      : `Stage 1 · markets ${page}/${totalPages}`;
    await hooks.onStage1(
      all ? rows.length : page,
      all ? rows.length : totalPages,
      label,
    );
    if (batch.length < MARKETS_PER_PAGE) break;
    if (!all && page >= totalPages) break;
    page += 1;
  }

  if (hooks.isCancelled()) return;
  const finalRows = all ? rows : rows.slice(0, config.universeSize);
  await repo.replaceMarkets(finalRows);
}

/** Load the cached universe as normalized tokens (Stage 2 fields undefined). */
export async function loadTokens(universeSize: number): Promise<TokenData[]> {
  const rows = await repo.getTopMarkets(universeSize);
  return rows.map(marketRowToToken);
}

/** Stage 2: fill genesis_date + categories for candidates (cache-first), in place. */
export async function fetchStage2(
  candidates: TokenData[],
  hooks: FunnelHooks,
): Promise<void> {
  const total = candidates.length;
  if (total === 0) {
    await hooks.onStage2(0, 0, 0);
    return;
  }

  const ids = candidates.map((t) => t.id);
  const cached = await repo.getFreshDetails(ids, DETAIL_TTL_MS);
  const cachedMap = new Map(cached.map((d) => [d.coingeckoId, d]));

  for (const t of candidates) {
    const d = cachedMap.get(t.id);
    if (d) {
      t.genesis_date = d.genesisDate;
      t.categories = safeParseCategories(d.categories);
    }
  }

  const uncached = candidates.filter((t) => !cachedMap.has(t.id));
  let done = total - uncached.length;
  await hooks.onStage2(done, total, estimateStage2Seconds(uncached.length));

  const step = total > 500 ? 10 : 1;
  let processed = 0;
  for (const t of uncached) {
    if (hooks.isCancelled()) return;
    try {
      const detail = await fetchCoinDetail(t.id, hooks.signal);
      const cats = (detail.categories ?? []).filter(
        (c): c is string => Boolean(c),
      );
      t.genesis_date = detail.genesis_date ?? null;
      t.categories = cats;
      await repo.upsertDetail({
        coingeckoId: t.id,
        genesisDate: detail.genesis_date ?? null,
        categories: cats,
        fetchedAt: new Date(),
      });
    } catch (err) {
      if (hooks.isCancelled()) return;
      // A persistent 429 (after the client's own retries) should fail the scan.
      if (err instanceof CoinGeckoError && err.status === 429) throw err;
      // 404 / other: token simply has no classification data → can't match Stage 2.
      t.genesis_date = t.genesis_date ?? null;
      t.categories = t.categories ?? [];
    }
    done += 1;
    processed += 1;
    if (processed % step === 0 || done === total) {
      await hooks.onStage2(
        done,
        total,
        estimateStage2Seconds(uncached.length - processed),
      );
    }
  }
}

function safeParseCategories(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
