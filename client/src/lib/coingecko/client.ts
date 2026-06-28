import { acquireSlot, penalize, sleep } from "./rateLimiter";
import {
  PRICE_CHANGE_TIMEFRAMES,
  type CoinCategory,
  type CoinDetail,
  type CoinMarket,
} from "./types";

const BASE_URL = "https://api.coingecko.com/api/v3";
const MAX_RETRIES = 4;
const MAX_BACKOFF_MS = 8_000;

export class CoinGeckoError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "CoinGeckoError";
    this.status = status;
  }
}

/** True when a Demo API key is configured. Used to fail fast with a clear message. */
export function hasApiKey(): boolean {
  return Boolean(process.env.COINGECKO_API_KEY);
}

function backoffMs(attempt: number): number {
  const base = Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt);
  return base + Math.floor(Math.random() * 250);
}

type QueryParams = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function cgFetch<T>(
  path: string,
  params?: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  const key = process.env.COINGECKO_API_KEY;
  if (key) headers["x-cg-demo-api-key"] = key;

  const url = buildUrl(path, params);
  let attempt = 0;

  for (;;) {
    await acquireSlot(signal);
    if (signal?.aborted) throw new CoinGeckoError("aborted");

    let res: Response;
    try {
      res = await fetch(url, { headers, signal, cache: "no-store" });
    } catch (err) {
      if (signal?.aborted) throw new CoinGeckoError("aborted");
      if (attempt >= MAX_RETRIES) {
        throw new CoinGeckoError(`network error: ${(err as Error).message}`);
      }
      attempt += 1;
      await sleep(backoffMs(attempt), signal);
      continue;
    }

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : backoffMs(attempt + 1);
      penalize(waitMs); // back the whole process off, not just this call
      if (attempt >= MAX_RETRIES) {
        throw new CoinGeckoError("rate limited (429) after retries", 429);
      }
      attempt += 1;
      await sleep(waitMs, signal);
      continue;
    }

    if (res.status >= 500) {
      if (attempt >= MAX_RETRIES) {
        throw new CoinGeckoError(`server error ${res.status}`, res.status);
      }
      attempt += 1;
      await sleep(backoffMs(attempt), signal);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new CoinGeckoError(
        `request failed ${res.status}: ${body.slice(0, 200)}`,
        res.status,
      );
    }

    return (await res.json()) as T;
  }
}

/** GET /coins/markets — one page (max 250) sorted by market cap desc. */
export function fetchMarketsPage(
  page: number,
  perPage = 250,
  signal?: AbortSignal,
): Promise<CoinMarket[]> {
  return cgFetch<CoinMarket[]>(
    "/coins/markets",
    {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: perPage,
      page,
      sparkline: false,
      price_change_percentage: PRICE_CHANGE_TIMEFRAMES.join(","),
    },
    signal,
  );
}

/** GET /coins/{id} — slimmed to surface genesis_date + categories in one call. */
export function fetchCoinDetail(
  id: string,
  signal?: AbortSignal,
): Promise<CoinDetail> {
  return cgFetch<CoinDetail>(
    `/coins/${encodeURIComponent(id)}`,
    {
      localization: false,
      tickers: false,
      market_data: false,
      community_data: false,
      developer_data: false,
      sparkline: false,
    },
    signal,
  );
}

/** GET /coins/categories/list — for the category multi-select. */
export function fetchCategoriesList(
  signal?: AbortSignal,
): Promise<CoinCategory[]> {
  return cgFetch<CoinCategory[]>("/coins/categories/list", undefined, signal);
}
