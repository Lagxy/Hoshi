/** Core screener domain types — shared by the engine, API, and UI. */

export type Logic = "AND" | "OR";

export type Operator = ">" | "<" | ">=" | "<=" | "between" | "in";

export type Timeframe = "1h" | "24h" | "7d" | "14d" | "30d" | "200d" | "1y";

export type FieldKey =
  | "market_cap"
  | "fdv"
  | "fdv_mcap_ratio"
  | "price_change_pct"
  | "ath_change_pct"
  | "total_volume"
  | "vol_mcap_ratio"
  | "token_age_days"
  | "category";

export type FieldGroup =
  | "Valuation"
  | "Momentum"
  | "Liquidity"
  | "Classification";

/** Which funnel stage supplies a field's data. */
export type FieldSource = "stage1" | "stage2";

/** A single filter condition (flat list; one global AND/OR across them all). */
export interface Condition {
  id: string;
  field: FieldKey;
  operator: Operator;
  value: number | null;
  value2?: number | null; // upper bound for "between"
  timeframe?: Timeframe; // required for price_change_pct
  categories?: string[]; // selected category ids for "in"
}

export interface ScanConfig {
  universeSize: number;
  logic: Logic;
  conditions: Condition[];
}

/** Normalized token the evaluator sees (Stage 1 always; Stage 2 fields optional). */
export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  fdv: number | null;
  total_volume: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  price_change: Record<Timeframe, number | null>;
  // Stage 2 (undefined until classification detail is fetched):
  genesis_date?: string | null;
  categories?: string[];
}
