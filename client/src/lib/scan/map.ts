import type { CoinMarket } from "@/lib/coingecko/types";
import type { MarketRowInput } from "@/lib/db/repo";
import type { TokenData } from "./types";

/** CoinGecko markets row → cacheable DB row. */
export function marketToRowInput(m: CoinMarket, fetchedAt: Date): MarketRowInput {
  return {
    coingeckoId: m.id,
    rank: m.market_cap_rank,
    symbol: m.symbol,
    name: m.name,
    image: m.image,
    currentPrice: m.current_price,
    marketCap: m.market_cap,
    fdv: m.fully_diluted_valuation,
    totalVolume: m.total_volume,
    circulatingSupply: m.circulating_supply,
    totalSupply: m.total_supply,
    maxSupply: m.max_supply,
    ath: m.ath,
    athChangePercentage: m.ath_change_percentage,
    pc1h: m.price_change_percentage_1h_in_currency,
    pc24h: m.price_change_percentage_24h_in_currency,
    pc7d: m.price_change_percentage_7d_in_currency,
    pc14d: m.price_change_percentage_14d_in_currency,
    pc30d: m.price_change_percentage_30d_in_currency,
    pc200d: m.price_change_percentage_200d_in_currency,
    pc1y: m.price_change_percentage_1y_in_currency,
    fetchedAt,
  };
}

/** The subset of cached MarketCache columns the evaluator needs. */
export interface MarketRowLike {
  coingeckoId: string;
  symbol: string;
  name: string;
  image: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  fdv: number | null;
  totalVolume: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
  athChangePercentage: number | null;
  pc1h: number | null;
  pc24h: number | null;
  pc7d: number | null;
  pc14d: number | null;
  pc30d: number | null;
  pc200d: number | null;
  pc1y: number | null;
}

/** Cached DB row → normalized token for evaluation (Stage 2 fields left undefined). */
export function marketRowToToken(r: MarketRowLike): TokenData {
  return {
    id: r.coingeckoId,
    symbol: r.symbol,
    name: r.name,
    image: r.image,
    current_price: r.currentPrice,
    market_cap: r.marketCap,
    fdv: r.fdv,
    total_volume: r.totalVolume,
    circulating_supply: r.circulatingSupply,
    total_supply: r.totalSupply,
    max_supply: r.maxSupply,
    ath: r.ath,
    ath_change_percentage: r.athChangePercentage,
    price_change: {
      "1h": r.pc1h,
      "24h": r.pc24h,
      "7d": r.pc7d,
      "14d": r.pc14d,
      "30d": r.pc30d,
      "200d": r.pc200d,
      "1y": r.pc1y,
    },
  };
}
