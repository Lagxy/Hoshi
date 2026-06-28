import { PRICE_CHANGE_TIMEFRAMES } from "@/lib/coingecko/types";
import { FIELDS } from "./fields";
import type { Condition, FieldKey, Operator, ScanConfig } from "./types";

const NUMERIC_OPERATORS = new Set<Operator>([">", "<", ">=", "<=", "between"]);
const TIMEFRAMES = new Set<string>(PRICE_CHANGE_TIMEFRAMES);

type Result =
  | { ok: true; config: ScanConfig }
  | { ok: false; error: string };

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function validateCondition(
  raw: unknown,
  index: number,
): { condition: Condition } | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: `condition ${index}: must be an object` };
  }
  const r = raw as Record<string, unknown>;
  const field = r.field as FieldKey;
  if (!field || !(field in FIELDS)) {
    return { error: `condition ${index}: unknown field "${String(r.field)}"` };
  }
  const def = FIELDS[field];

  if (def.kind === "category") {
    const categories = Array.isArray(r.categories)
      ? r.categories.filter((c): c is string => typeof c === "string")
      : [];
    return {
      condition: { id: stringId(r.id, index), field, operator: "in", value: null, categories },
    };
  }

  const operator = r.operator as Operator;
  if (!NUMERIC_OPERATORS.has(operator)) {
    return { error: `condition ${index}: invalid operator "${String(r.operator)}"` };
  }
  const value = toNumberOrNull(r.value);
  if (value == null) {
    return { error: `condition ${index}: numeric value required` };
  }
  let value2: number | null | undefined;
  if (operator === "between") {
    value2 = toNumberOrNull(r.value2);
    if (value2 == null) {
      return { error: `condition ${index}: "between" needs a second value` };
    }
  }

  let timeframe: Condition["timeframe"];
  if (def.needsTimeframe) {
    if (typeof r.timeframe !== "string" || !TIMEFRAMES.has(r.timeframe)) {
      return { error: `condition ${index}: price change needs a valid timeframe` };
    }
    timeframe = r.timeframe as Condition["timeframe"];
  }

  return {
    condition: {
      id: stringId(r.id, index),
      field,
      operator,
      value,
      value2,
      timeframe,
    },
  };
}

export function validateScanRequest(body: unknown): Result {
  if (!body || typeof body !== "object") return fail("request body required");
  const b = body as Record<string, unknown>;

  const universeSize = Number(b.universeSize);
  if (!Number.isFinite(universeSize) || universeSize <= 0) {
    return fail("invalid universeSize");
  }
  if (b.logic !== "AND" && b.logic !== "OR") {
    return fail('logic must be "AND" or "OR"');
  }
  if (!Array.isArray(b.conditions)) return fail("conditions must be an array");

  const conditions: Condition[] = [];
  for (const [i, raw] of b.conditions.entries()) {
    const res = validateCondition(raw, i);
    if ("error" in res) return fail(res.error);
    conditions.push(res.condition);
  }

  return { ok: true, config: { universeSize, logic: b.logic, conditions } };
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function stringId(v: unknown, index: number): string {
  return typeof v === "string" && v.length > 0 ? v : `c${index}`;
}
