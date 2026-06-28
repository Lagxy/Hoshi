/** CoinGecko response shapes — only the fields Hoshi consumes. */

/** One row from GET /coins/markets (with price_change_percentage timeframes requested). */
export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_14d_in_currency: number | null;
  price_change_percentage_30d_in_currency: number | null;
  price_change_percentage_200d_in_currency: number | null;
  price_change_percentage_1y_in_currency: number | null;
}

/** Slimmed GET /coins/{id} — only genesis_date + categories (one call covers both). */
export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  genesis_date: string | null;
  categories: (string | null)[] | null;
}

/** One entry from GET /coins/categories/list. */
export interface CoinCategory {
  category_id: string;
  name: string;
}

/** Price-change timeframe keys, as accepted by the CoinGecko query param. */
export const PRICE_CHANGE_TIMEFRAMES = [
  "1h",
  "24h",
  "7d",
  "14d",
  "30d",
  "200d",
  "1y",
] as const;

export type PriceChangeTimeframe = (typeof PRICE_CHANGE_TIMEFRAMES)[number];
