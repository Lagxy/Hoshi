import { FIELD_GROUPS, FIELDS, type FieldDef } from "@/lib/scan/fields";
import type {
  Condition,
  FieldGroup,
  FieldKey,
  Operator,
  Timeframe,
} from "@/lib/scan/types";

export const OPERATOR_OPTIONS: { value: Operator; label: string }[] = [
  { value: ">", label: "＞ greater than" },
  { value: "<", label: "＜ less than" },
  { value: ">=", label: "≥ at least" },
  { value: "<=", label: "≤ at most" },
  { value: "between", label: "↔ between" },
];

export const TIMEFRAME_OPTIONS: Timeframe[] = [
  "1h",
  "24h",
  "7d",
  "14d",
  "30d",
  "200d",
  "1y",
];

export function groupedFields(): { group: FieldGroup; fields: FieldDef[] }[] {
  return FIELD_GROUPS.map((group) => ({
    group,
    fields: Object.values(FIELDS).filter((f) => f.group === group),
  }));
}

/** Stable signature for detecting exact-duplicate conditions. */
export function conditionSignature(c: Condition): string {
  const cats = (c.categories ?? []).slice().sort().join(",");
  return [
    c.field,
    c.operator,
    c.timeframe ?? "",
    c.value ?? "",
    c.value2 ?? "",
    cats,
  ].join("|");
}

let counter = 0;

/** Build a sensible default condition for a field. */
export function makeCondition(field: FieldKey = "market_cap"): Condition {
  const def = FIELDS[field];
  const condition: Condition = {
    id: `c${Date.now()}_${counter++}`,
    field,
    operator: def.kind === "category" ? "in" : ">",
    value: def.kind === "category" ? null : 0,
  };
  if (def.needsTimeframe) condition.timeframe = "24h";
  if (def.kind === "category") condition.categories = [];
  return condition;
}
