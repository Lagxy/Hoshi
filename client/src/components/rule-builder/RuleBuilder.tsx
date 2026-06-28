"use client";

import type { CategoryOption } from "@/lib/client/api";
import type { Condition, Logic } from "@/lib/scan/types";
import { ConditionRow } from "./ConditionRow";
import { LogicToggle } from "./LogicToggle";
import { makeCondition } from "./fieldMeta";

export function RuleBuilder({
  conditions,
  logic,
  categories,
  categoriesLoading,
  disabled,
  duplicateIds,
  onLogicChange,
  onConditionsChange,
}: {
  conditions: Condition[];
  logic: Logic;
  categories: CategoryOption[];
  categoriesLoading?: boolean;
  disabled?: boolean;
  duplicateIds?: Set<string>;
  onLogicChange: (logic: Logic) => void;
  onConditionsChange: (conditions: Condition[]) => void;
}) {
  const update = (id: string, next: Condition) =>
    onConditionsChange(conditions.map((c) => (c.id === id ? next : c)));
  const remove = (id: string) =>
    onConditionsChange(conditions.filter((c) => c.id !== id));
  const add = () => onConditionsChange([...conditions, makeCondition()]);

  return (
    <section className="border border-line bg-bg-raised/40">
      <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-display text-xs font-bold tracking-[0.2em] text-cyan">
          RULES
        </h2>
        <div className="flex items-center gap-3">
          {conditions.length > 1 && (
            <span className="hidden text-[11px] text-fg-faint sm:inline">
              {logic === "AND" ? "match ALL" : "match ANY"} of{" "}
              {conditions.length}
            </span>
          )}
          <LogicToggle
            value={logic}
            onChange={onLogicChange}
            disabled={disabled || conditions.length < 2}
          />
        </div>
      </header>

      <div className="flex flex-col gap-2 p-4">
        {conditions.length === 0 && (
          <p className="py-6 text-center text-sm text-fg-faint">
            <span className="text-cyan">›</span> no conditions — a scan with no
            rules returns the whole universe
          </p>
        )}

        {conditions.map((condition) => (
          <ConditionRow
            key={condition.id}
            condition={condition}
            categories={categories}
            categoriesLoading={categoriesLoading}
            disabled={disabled}
            duplicate={duplicateIds?.has(condition.id)}
            onChange={(next) => update(condition.id, next)}
            onRemove={() => remove(condition.id)}
          />
        ))}

        <button
          type="button"
          disabled={disabled}
          onClick={add}
          className="mt-1 self-start border border-dashed border-line-bright px-3 py-1.5 text-xs tracking-wide text-fg-dim transition-colors hover:border-cyan hover:text-cyan disabled:opacity-40"
        >
          + ADD CONDITION
        </button>
      </div>
    </section>
  );
}
