import { CoinGeckoError, hasApiKey } from "@/lib/coingecko/client";
import * as repo from "@/lib/db/repo";
import { buildResultColumns, buildResultRow } from "./columns";
import {
  evaluateToken,
  passesAll,
  passesAny,
  splitConditions,
} from "./evaluate";
import { estimateStage2Seconds } from "./estimate";
import {
  ensureMarketsFresh,
  fetchStage2,
  loadTokens,
  type FunnelHooks,
} from "./funnel";
import type { Condition, Logic, ScanConfig } from "./types";

// Singleton scan runner. One scan at a time (single user). Pinned to globalThis so
// dev HMR doesn't spawn a parallel runner. The scan runs as a detached promise the
// Node process keeps alive across requests (not `after()`, which is request-bound).

interface RunnerState {
  activeId: string | null;
  cancel: Set<string>;
  controllers: Map<string, AbortController>;
}

const g = globalThis as unknown as { __hoshiRunner?: RunnerState };
const state =
  g.__hoshiRunner ??
  (g.__hoshiRunner = {
    activeId: null,
    cancel: new Set(),
    controllers: new Map(),
  });

export function getActiveScanId(): string | null {
  return state.activeId;
}

export function requestCancel(id: string): void {
  state.cancel.add(id);
  state.controllers.get(id)?.abort();
}

function isCancelled(id: string): boolean {
  return state.cancel.has(id);
}

/** Kick off a scan (fire-and-forget). Returns false if another scan is active. */
export function startScan(id: string): boolean {
  if (state.activeId && state.activeId !== id) return false;
  state.activeId = id;
  const controller = new AbortController();
  state.controllers.set(id, controller);
  void runScan(id, controller.signal);
  return true;
}

function parseConfig(scan: {
  universeSize: number;
  logic: string;
  conditions: string;
}): ScanConfig {
  let conditions: Condition[] = [];
  try {
    const parsed = JSON.parse(scan.conditions);
    if (Array.isArray(parsed)) conditions = parsed as Condition[];
  } catch {
    conditions = [];
  }
  return {
    universeSize: scan.universeSize,
    logic: scan.logic as Logic,
    conditions,
  };
}

async function runScan(id: string, signal: AbortSignal): Promise<void> {
  try {
    const scan = await repo.getScan(id);
    if (!scan) return;
    const config = parseConfig(scan);

    if (!hasApiKey()) {
      throw new Error("COINGECKO_API_KEY is not set — add it to .env.local");
    }

    const hooks: FunnelHooks = {
      signal,
      isCancelled: () => isCancelled(id),
      onStage1: async (current, total, label) => {
        await repo.updateScan(id, {
          progressCurrent: current,
          progressTotal: total,
          stage: label,
        });
      },
      onStage2: async (current, total, etaSeconds) => {
        await repo.updateScan(id, {
          progressCurrent: current,
          progressTotal: total,
          etaSeconds,
        });
      },
    };

    // ── Stage 1 ──────────────────────────────────────────────────────────
    await repo.updateScan(id, {
      status: "running_stage1",
      startedAt: new Date(),
      stage: "Stage 1 · markets",
      progressCurrent: 0,
      progressTotal: 0,
      etaSeconds: null,
      errorMessage: null,
    });
    await ensureMarketsFresh(config, hooks);
    if (isCancelled(id)) return await finishCancelled(id);

    const tokens = await loadTokens(config.universeSize);
    const { stage1, stage2 } = splitConditions(config.conditions);

    // ── Stage 2 (only if a classification field is referenced) ───────────
    let finalSet = tokens;
    if (stage2.length > 0) {
      let candidates;
      if (config.logic === "AND") {
        // AND: a token failing any cheap condition can't match — narrow first.
        candidates = tokens.filter((t) => passesAll(t, stage1));
        finalSet = candidates;
      } else {
        // OR: a token already matching a cheap condition is in regardless of
        // detail — only fetch detail for the rest.
        candidates = tokens.filter((t) => !passesAny(t, stage1));
        finalSet = tokens;
      }
      await repo.updateScan(id, {
        status: "running_stage2",
        stage: "Stage 2 · token detail",
        progressCurrent: 0,
        progressTotal: candidates.length,
        etaSeconds: estimateStage2Seconds(candidates.length),
      });
      await fetchStage2(candidates, hooks);
      if (isCancelled(id)) return await finishCancelled(id);
    }

    // ── Final evaluation + results ───────────────────────────────────────
    const matched = finalSet.filter((t) => evaluateToken(t, config));
    const columns = buildResultColumns(config.conditions);
    const results = matched.map((t) => buildResultRow(t, columns));

    await repo.updateScan(id, {
      status: "completed",
      stage: "Complete",
      finishedAt: new Date(),
      matchedCount: matched.length,
      results: JSON.stringify(results),
      resultColumns: JSON.stringify(columns),
      etaSeconds: 0,
    });
  } catch (err) {
    if (isCancelled(id)) {
      await finishCancelled(id);
      return;
    }
    const message =
      err instanceof CoinGeckoError
        ? `CoinGecko: ${err.message}`
        : ((err as Error).message ?? "Unknown error");
    await repo
      .updateScan(id, {
        status: "failed",
        stage: "Failed",
        finishedAt: new Date(),
        errorMessage: message,
      })
      .catch(() => {});
  } finally {
    state.controllers.delete(id);
    state.cancel.delete(id);
    if (state.activeId === id) state.activeId = null;
  }
}

async function finishCancelled(id: string): Promise<void> {
  await repo
    .updateScan(id, {
      status: "cancelled",
      stage: "Cancelled",
      finishedAt: new Date(),
      etaSeconds: 0,
    })
    .catch(() => {});
}
