import type {
  Condition,
  FieldGroup,
  FieldKey,
  FieldSource,
  TokenData,
} from "./types";

const DAY_MS = 86_400_000;

export type FieldUnit = "usd" | "percent" | "ratio" | "days" | "category";

export interface FieldDef {
  key: FieldKey;
  label: string;
  group: FieldGroup;
  source: FieldSource;
  kind: "number" | "category";
  unit: FieldUnit;
  /** Price-change picks a timeframe per condition. */
  needsTimeframe?: boolean;
  /** Numeric value used for comparison; null when not computable for this token. */
  extract?: (token: TokenData, condition: Condition) => number | null;
}

function ratio(num: number | null, den: number | null): number | null {
  if (num == null || den == null || den === 0) return null;
  return num / den;
}

/** Days since genesis_date (UTC), or null if absent/unparseable. */
export function tokenAgeDays(
  genesisDate: string | null | undefined,
  now: number = Date.now(),
): number | null {
  if (!genesisDate) return null;
  const ts = Date.parse(genesisDate);
  if (Number.isNaN(ts)) return null;
  return Math.floor((now - ts) / DAY_MS);
}

/** The v1 field registry — single source of truth for fields and how to read them. */
export const FIELDS: Record<FieldKey, FieldDef> = {
  market_cap: {
    key: "market_cap",
    label: "Market Cap",
    group: "Valuation",
    source: "stage1",
    kind: "number",
    unit: "usd",
    extract: (t) => t.market_cap,
  },
  fdv: {
    key: "fdv",
    label: "FDV",
    group: "Valuation",
    source: "stage1",
    kind: "number",
    unit: "usd",
    extract: (t) => t.fdv,
  },
  fdv_mcap_ratio: {
    key: "fdv_mcap_ratio",
    label: "FDV / MCap",
    group: "Valuation",
    source: "stage1",
    kind: "number",
    unit: "ratio",
    extract: (t) => ratio(t.fdv, t.market_cap),
  },
  price_change_pct: {
    key: "price_change_pct",
    label: "Price Change %",
    group: "Momentum",
    source: "stage1",
    kind: "number",
    unit: "percent",
    needsTimeframe: true,
    extract: (t, c) => (c.timeframe ? t.price_change[c.timeframe] : null),
  },
  ath_change_pct: {
    key: "ath_change_pct",
    label: "% from ATH",
    group: "Momentum",
    source: "stage1",
    kind: "number",
    unit: "percent",
    extract: (t) => t.ath_change_percentage,
  },
  total_volume: {
    key: "total_volume",
    label: "24h Volume",
    group: "Liquidity",
    source: "stage1",
    kind: "number",
    unit: "usd",
    extract: (t) => t.total_volume,
  },
  vol_mcap_ratio: {
    key: "vol_mcap_ratio",
    label: "Volume / MCap",
    group: "Liquidity",
    source: "stage1",
    kind: "number",
    unit: "ratio",
    extract: (t) => ratio(t.total_volume, t.market_cap),
  },
  token_age_days: {
    key: "token_age_days",
    label: "Token Age (days)",
    group: "Classification",
    source: "stage2",
    kind: "number",
    unit: "days",
    extract: (t) => tokenAgeDays(t.genesis_date),
  },
  category: {
    key: "category",
    label: "Category",
    group: "Classification",
    source: "stage2",
    kind: "category",
    unit: "category",
  },
};

export const FIELD_LIST: FieldDef[] = Object.values(FIELDS);

export const FIELD_GROUPS: FieldGroup[] = [
  "Valuation",
  "Momentum",
  "Liquidity",
  "Classification",
];

export function getField(key: FieldKey): FieldDef {
  return FIELDS[key];
}

/** A condition needs Stage 2 when its field is sourced from /coins/{id}. */
export function conditionNeedsStage2(condition: Condition): boolean {
  return FIELDS[condition.field].source === "stage2";
}

export function configNeedsStage2(conditions: Condition[]): boolean {
  return conditions.some(conditionNeedsStage2);
}
