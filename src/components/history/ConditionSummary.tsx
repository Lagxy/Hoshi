import { FIELDS } from "@/lib/scan/fields";
import { formatByUnit } from "@/lib/format";
import type { Condition, Logic } from "@/lib/scan/types";

function fmt(unit: string, v: number | null | undefined): string {
  return v == null ? "?" : formatByUnit(unit, v);
}

export function describeCondition(c: Condition): string {
  const def = FIELDS[c.field];
  if (def.kind === "category") {
    const cats = c.categories ?? [];
    return `${def.label} ∈ [${cats.length ? cats.join(", ") : "any"}]`;
  }
  const label =
    c.field === "price_change_pct" && c.timeframe
      ? `${def.label} ${c.timeframe}`
      : def.label;
  const rhs =
    c.operator === "between"
      ? `${fmt(def.unit, c.value)} – ${fmt(def.unit, c.value2)}`
      : `${c.operator} ${fmt(def.unit, c.value)}`;
  return `${label} ${rhs}`;
}

export function ConditionSummary({
  conditions,
  logic,
}: {
  conditions: Condition[];
  logic: Logic;
}) {
  if (conditions.length === 0) {
    return <span className="text-fg-faint">no filters (whole universe)</span>;
  }
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {conditions.map((c, i) => (
        <span key={c.id} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-[10px] font-bold tracking-wider text-cyan/70">
              {logic}
            </span>
          )}
          <span className="border border-line bg-bg-sunken px-1.5 py-0.5 text-[11px] text-fg-dim">
            {describeCondition(c)}
          </span>
        </span>
      ))}
    </span>
  );
}
