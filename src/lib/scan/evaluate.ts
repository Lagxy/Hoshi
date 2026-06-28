import { conditionNeedsStage2, FIELDS } from "./fields";
import type { Condition, FieldKey, ScanConfig, TokenData } from "./types";

/**
 * Evaluate one condition against a token.
 * Returns false when the token lacks the data the condition needs (e.g. a null
 * field, or Stage-2 categories not yet fetched) — a token can't match on data
 * it doesn't have.
 */
export function evaluateCondition(
  token: TokenData,
  condition: Condition,
): boolean {
  const field = FIELDS[condition.field];

  if (field.kind === "category") {
    const selected = condition.categories ?? [];
    if (selected.length === 0) return true; // nothing chosen → no constraint
    const tokenCats = token.categories;
    if (!tokenCats || tokenCats.length === 0) return false;
    const set = new Set(tokenCats);
    return selected.some((name) => set.has(name));
  }

  const v = field.extract ? field.extract(token, condition) : null;
  if (v == null || Number.isNaN(v)) return false;

  const { operator, value, value2 } = condition;
  switch (operator) {
    case ">":
      return value != null && v > value;
    case "<":
      return value != null && v < value;
    case ">=":
      return value != null && v >= value;
    case "<=":
      return value != null && v <= value;
    case "between": {
      if (value == null || value2 == null) return false;
      const lo = Math.min(value, value2);
      const hi = Math.max(value, value2);
      return v >= lo && v <= hi;
    }
    default:
      return false;
  }
}

export function passesAll(token: TokenData, conditions: Condition[]): boolean {
  return conditions.every((c) => evaluateCondition(token, c));
}

export function passesAny(token: TokenData, conditions: Condition[]): boolean {
  return conditions.some((c) => evaluateCondition(token, c));
}

/** Evaluate the full rule set with the global AND/OR logic. */
export function evaluateToken(token: TokenData, config: ScanConfig): boolean {
  const { conditions, logic } = config;
  if (conditions.length === 0) return true; // no rules → whole universe
  return logic === "AND"
    ? passesAll(token, conditions)
    : passesAny(token, conditions);
}

/** Unique field keys referenced by the conditions, in first-seen order. */
export function referencedFieldKeys(conditions: Condition[]): FieldKey[] {
  const seen = new Set<FieldKey>();
  const out: FieldKey[] = [];
  for (const c of conditions) {
    if (!seen.has(c.field)) {
      seen.add(c.field);
      out.push(c.field);
    }
  }
  return out;
}

/** Partition conditions by funnel stage. */
export function splitConditions(conditions: Condition[]): {
  stage1: Condition[];
  stage2: Condition[];
} {
  const stage1: Condition[] = [];
  const stage2: Condition[] = [];
  for (const c of conditions) {
    if (conditionNeedsStage2(c)) stage2.push(c);
    else stage1.push(c);
  }
  return { stage1, stage2 };
}
