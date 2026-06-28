"use client";

import type { CategoryOption } from "@/lib/client/api";
import { FIELDS } from "@/lib/scan/fields";
import type { Condition, FieldKey, Operator, Timeframe } from "@/lib/scan/types";
import { CategoryMultiSelect } from "./CategoryMultiSelect";
import { NumberInput } from "./NumberInput";
import {
  OPERATOR_OPTIONS,
  TIMEFRAME_OPTIONS,
  groupedFields,
  makeCondition,
} from "./fieldMeta";

const selectClass =
  "border border-line bg-bg-sunken px-2 py-1.5 text-xs text-fg focus:border-cyan focus:outline-none disabled:opacity-40";
const inputClass = `${selectClass} w-32 tabular-nums`;

export function ConditionRow({
  condition,
  categories,
  categoriesLoading,
  disabled,
  duplicate,
  onChange,
  onRemove,
}: {
  condition: Condition;
  categories: CategoryOption[];
  categoriesLoading?: boolean;
  disabled?: boolean;
  duplicate?: boolean;
  onChange: (next: Condition) => void;
  onRemove: () => void;
}) {
  const def = FIELDS[condition.field];

  const changeField = (field: FieldKey) => {
    onChange({ ...makeCondition(field), id: condition.id });
  };

  // No separator ambiguity: only integer fields (usd/days) get dot grouping;
  // decimal fields (ratio/percent) stay plain so the dot is the decimal point.
  const grouping = def.unit === "usd" || def.unit === "days";
  const decimals = def.unit === "ratio" || def.unit === "percent";
  const allowNegative = def.unit === "percent";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 border bg-bg-raised/50 px-2.5 py-2 ${
        duplicate ? "border-loss/60" : "border-line"
      }`}
    >
      {/* field */}
      <select
        aria-label="Field"
        disabled={disabled}
        value={condition.field}
        onChange={(e) => changeField(e.target.value as FieldKey)}
        className={`${selectClass} min-w-40`}
      >
        {groupedFields().map(({ group, fields }) => (
          <optgroup key={group} label={group}>
            {fields.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* timeframe (price change only) */}
      {def.needsTimeframe && (
        <select
          aria-label="Timeframe"
          disabled={disabled}
          value={condition.timeframe ?? "24h"}
          onChange={(e) =>
            onChange({ ...condition, timeframe: e.target.value as Timeframe })
          }
          className={selectClass}
        >
          {TIMEFRAME_OPTIONS.map((tf) => (
            <option key={tf} value={tf}>
              {tf}
            </option>
          ))}
        </select>
      )}

      {def.kind === "category" ? (
        <CategoryMultiSelect
          selected={condition.categories ?? []}
          options={categories}
          loading={categoriesLoading}
          disabled={disabled}
          onChange={(cats) => onChange({ ...condition, categories: cats })}
        />
      ) : (
        <>
          {/* operator */}
          <select
            aria-label="Operator"
            disabled={disabled}
            value={condition.operator}
            onChange={(e) =>
              onChange({ ...condition, operator: e.target.value as Operator })
            }
            className={selectClass}
          >
            {OPERATOR_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          {/* value(s) */}
          <NumberInput
            ariaLabel="Value"
            value={condition.value ?? null}
            onChange={(v) => onChange({ ...condition, value: v })}
            grouping={grouping}
            decimals={decimals}
            allowNegative={allowNegative}
            placeholder="value"
            disabled={disabled}
            className={inputClass}
          />
          {condition.operator === "between" && (
            <>
              <span className="text-fg-faint">and</span>
              <NumberInput
                ariaLabel="Upper value"
                value={condition.value2 ?? null}
                onChange={(v) => onChange({ ...condition, value2: v })}
                grouping={grouping}
                decimals={decimals}
                allowNegative={allowNegative}
                placeholder="value"
                disabled={disabled}
                className={inputClass}
              />
            </>
          )}
          <span className="text-[10px] uppercase tracking-wider text-fg-faint">
            {def.unit}
          </span>
        </>
      )}

      {duplicate && (
        <span className="border border-loss/50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-loss">
          DUPLICATE
        </span>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        aria-label="Remove condition"
        className="ml-auto px-2 py-1 text-fg-faint transition-colors hover:text-loss disabled:opacity-40"
      >
        ✕
      </button>
    </div>
  );
}
