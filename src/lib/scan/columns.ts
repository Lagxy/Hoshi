import { FIELDS } from "./fields";
import type { Condition, FieldKey, Timeframe, TokenData } from "./types";

/** A dynamic results-table column derived from a referenced field. */
export interface ResultColumn {
  key: string;
  fieldKey: FieldKey;
  label: string;
  unit: string;
  timeframe?: Timeframe;
}

export type ColumnValue = number | string[] | null;

/** Result row stored per matched token (self-contained for history reopen). */
export interface ResultRow {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  values: Record<string, ColumnValue>;
}

/** Distinct column key — price-change is disambiguated by timeframe. */
function columnKey(c: Pick<Condition, "field" | "timeframe">): string {
  return c.field === "price_change_pct" && c.timeframe
    ? `price_change_pct_${c.timeframe}`
    : c.field;
}

/** One column per referenced field (price-change split per timeframe). */
export function buildResultColumns(conditions: Condition[]): ResultColumn[] {
  const map = new Map<string, ResultColumn>();
  for (const c of conditions) {
    const key = columnKey(c);
    if (map.has(key)) continue;
    const field = FIELDS[c.field];
    const label =
      c.field === "price_change_pct" && c.timeframe
        ? `Price Δ ${c.timeframe}`
        : field.label;
    map.set(key, {
      key,
      fieldKey: c.field,
      label,
      unit: field.unit,
      timeframe: c.timeframe,
    });
  }
  return [...map.values()];
}

export function computeColumnValue(
  token: TokenData,
  col: ResultColumn,
): ColumnValue {
  const field = FIELDS[col.fieldKey];
  if (field.kind === "category") return token.categories ?? [];
  if (col.fieldKey === "price_change_pct") {
    return col.timeframe ? token.price_change[col.timeframe] : null;
  }
  return field.extract
    ? field.extract(token, {
        id: "",
        field: col.fieldKey,
        operator: ">",
        value: null,
        timeframe: col.timeframe,
      })
    : null;
}

export function buildResultRow(
  token: TokenData,
  columns: ResultColumn[],
): ResultRow {
  const values: Record<string, ColumnValue> = {};
  for (const col of columns) values[col.key] = computeColumnValue(token, col);
  return {
    id: token.id,
    name: token.name,
    symbol: token.symbol,
    image: token.image,
    current_price: token.current_price,
    market_cap: token.market_cap,
    values,
  };
}
