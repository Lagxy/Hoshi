"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  type CategoryOption,
  cancelScan,
  getActiveScan,
  getCategories,
  getResults,
  getScanState,
  startScan,
} from "@/lib/client/api";
import { formatEta } from "@/lib/format";
import { ProgressPanel } from "@/components/progress/ProgressPanel";
import { ResultsTable } from "@/components/results/ResultsTable";
import { conditionSignature } from "@/components/rule-builder/fieldMeta";
import { RuleBuilder } from "@/components/rule-builder/RuleBuilder";
import { UniverseSelect } from "@/components/rule-builder/UniverseSelect";
import { isAllUniverse } from "@/lib/scan/constants";
import { estimateStage2Seconds } from "@/lib/scan/estimate";
import { FIELDS } from "@/lib/scan/fields";
import type { ScanResultsDTO, ScanStateDTO } from "@/lib/scan/serialize";
import type { Condition, Logic } from "@/lib/scan/types";

type Phase = "idle" | "running" | "done" | "error";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function ScreenerApp() {
  const [universeSize, setUniverseSize] = useState(250);
  const [logic, setLogic] = useState<Logic>("AND");
  const [conditions, setConditions] = useState<Condition[]>([]);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanStateDTO | null>(null);
  const [results, setResults] = useState<ScanResultsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const isRunning = phase === "running";

  // On mount: resume an in-flight scan, or clone a past scan's rules via ?from=<id>.
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const a = await getActiveScan();
        if (!active) return;
        if (a) {
          setUniverseSize(a.universeSize);
          setLogic(a.logic);
          setConditions(a.conditions);
          setScanId(a.id);
          setScanState(a);
          setPhase("running");
          return;
        }
      } catch {
        // ignore — fall through to clone check
      }

      const from = new URLSearchParams(window.location.search).get("from");
      if (!from) return;
      try {
        const s = await getScanState(from);
        if (!active) return;
        setUniverseSize(s.universeSize);
        setLogic(s.logic);
        // fresh ids so editing the clone never touches the saved scan
        setConditions(
          s.conditions.map((c, i) => ({ ...c, id: `c${Date.now()}_${i}` })),
        );
      } catch {
        // scan gone — leave the screener empty
      } finally {
        window.history.replaceState(null, "", "/");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Lazily load the category list when a category condition is added.
  const hasCategoryCondition = conditions.some((c) => c.field === "category");
  useEffect(() => {
    if (!hasCategoryCondition || categories.length > 0 || categoriesLoading) {
      return;
    }
    let active = true;
    void (async () => {
      setCategoriesLoading(true);
      try {
        const list = await getCategories();
        if (active) setCategories(list);
      } catch {
        // leave the list empty; the multi-select shows "any category"
      } finally {
        if (active) setCategoriesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [hasCategoryCondition, categories.length, categoriesLoading]);

  // Poll while running.
  useEffect(() => {
    if (!scanId || phase !== "running") return;
    let active = true;

    const poll = async () => {
      try {
        const s = await getScanState(scanId);
        if (!active) return;
        setScanState(s);
        if (s.status === "completed") {
          const r = await getResults(scanId);
          if (!active) return;
          setResults(r);
          setPhase("done");
        } else if (s.status === "failed") {
          setError(s.errorMessage ?? "Scan failed");
          setPhase("error");
        } else if (s.status === "cancelled") {
          setPhase("idle");
        } else if (s.status === "interrupted") {
          setError("Scan was interrupted by a server restart.");
          setPhase("error");
        }
      } catch (e) {
        if (active) {
          setError((e as Error).message);
          setPhase("error");
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [scanId, phase]);

  const invalid = conditions.some((c) => {
    const def = FIELDS[c.field];
    if (def.kind === "category") return false;
    if (c.value == null) return true;
    if (c.operator === "between" && c.value2 == null) return true;
    return false;
  });

  // Flag exact-duplicate conditions (same field/operator/timeframe/values/categories).
  const sigs = conditions.map(conditionSignature);
  const sigCounts = new Map<string, number>();
  for (const s of sigs) sigCounts.set(s, (sigCounts.get(s) ?? 0) + 1);
  const duplicateIds = new Set(
    conditions.filter((_, i) => (sigCounts.get(sigs[i]) ?? 0) > 1).map((c) => c.id),
  );
  const hasDuplicates = duplicateIds.size > 0;

  const hasStage2 = conditions.some((c) => FIELDS[c.field].source === "stage2");
  const showBigWarning = hasStage2 && universeSize >= 1000;
  const warnCount = isAllUniverse(universeSize) ? 15000 : universeSize;

  const run = async () => {
    setError(null);
    setResults(null);
    setScanState(null);
    setCancelling(false);
    try {
      const { id } = await startScan({ universeSize, logic, conditions });
      setScanId(id);
      setPhase("running");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  const cancel = async () => {
    if (!scanId) return;
    setCancelling(true);
    try {
      await cancelScan(scanId);
    } catch {
      setCancelling(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4"
    >
      {/* universe + run */}
      <motion.section
        variants={item}
        className="flex flex-wrap items-end justify-between gap-4 border border-line bg-bg-raised/40 p-4"
      >
        <div className="flex flex-col gap-2">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] text-fg-dim">
            UNIVERSE
          </span>
          <UniverseSelect
            value={universeSize}
            onChange={setUniverseSize}
            disabled={isRunning}
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={isRunning || invalid || hasDuplicates}
          className="group relative overflow-hidden border border-cyan bg-cyan/10 px-6 py-2.5 font-display text-sm font-bold tracking-[0.2em] text-cyan transition-colors hover:bg-cyan/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-fg-faint"
        >
          ▸ RUN SCAN
        </button>
      </motion.section>

      {showBigWarning && !isRunning && (
        <p className="border border-warn/30 bg-warn/5 px-4 py-2.5 text-xs text-warn">
          ⚠ Classification filter on a large universe — Stage 2 may take up to ~
          {formatEta(estimateStage2Seconds(warnCount))} on a cold run (cached
          tokens are skipped). Progress + cancel are available once it starts.
        </p>
      )}

      {hasDuplicates && !isRunning && (
        <p className="border border-loss/40 bg-loss/5 px-4 py-2.5 text-xs text-loss">
          ⚠ Duplicate conditions — remove the flagged rows before running.
        </p>
      )}

      {error && (
        <div className="border border-loss/40 bg-loss/5 px-4 py-3 text-sm text-loss">
          <span className="font-bold">SCAN FAILED · </span>
          {error}
        </div>
      )}

      <motion.div variants={item}>
        <RuleBuilder
          conditions={conditions}
          logic={logic}
          categories={categories}
          categoriesLoading={categoriesLoading}
          disabled={isRunning}
          duplicateIds={duplicateIds}
          onLogicChange={setLogic}
          onConditionsChange={setConditions}
        />
      </motion.div>

      {isRunning && scanState && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProgressPanel
            state={scanState}
            onCancel={cancel}
            cancelling={cancelling}
          />
        </motion.div>
      )}

      {results && !isRunning && <ResultsTable results={results} />}
    </motion.div>
  );
}
