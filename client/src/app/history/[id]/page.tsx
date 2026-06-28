import Link from "next/link";
import { notFound } from "next/navigation";
import { ConditionSummary } from "@/components/history/ConditionSummary";
import { StatusBadge } from "@/components/history/StatusBadge";
import { ResultsTable } from "@/components/results/ResultsTable";
import * as repo from "@/lib/db/repo";
import { universeLabel } from "@/lib/scan/constants";
import { toScanResults, toScanState } from "@/lib/scan/serialize";

export const dynamic = "force-dynamic";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scan = await repo.getScan(id);
  if (!scan) notFound();

  const state = toScanState(scan);
  const results = toScanResults(scan);
  const ranAt = state.finishedAt ?? state.startedAt ?? state.createdAt;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/history"
          className="text-xs tracking-wide text-fg-dim transition-colors hover:text-cyan"
        >
          ← HISTORY
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/?from=${id}`}
            title="Copy these rules into the screener to tweak & re-run"
            className="border border-cyan/50 px-2.5 py-1 text-xs tracking-wide text-cyan transition-colors hover:bg-cyan/10"
          >
            ⧉ COPY RULES
          </Link>
          <Link
            href="/"
            className="border border-line-bright px-2.5 py-1 text-xs tracking-wide text-fg-dim transition-colors hover:border-cyan hover:text-cyan"
          >
            + NEW SCAN
          </Link>
        </div>
      </div>

      <section className="border border-line bg-bg-raised/40 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <StatusBadge status={state.status} />
          <span className="text-fg-dim tabular-nums">
            {new Date(ranAt).toLocaleString()}
          </span>
          <span className="text-fg-faint">·</span>
          <span className="text-fg-dim">{universeLabel(state.universeSize)}</span>
          <span className="text-fg-faint">·</span>
          <span className="text-cyan tabular-nums">
            {state.matchedCount.toLocaleString()} matched
          </span>
        </div>
        <div className="mt-3">
          <ConditionSummary
            conditions={state.conditions}
            logic={state.logic}
          />
        </div>
        {state.errorMessage && (
          <p className="mt-3 text-xs text-loss">{state.errorMessage}</p>
        )}
      </section>

      {state.status === "completed" ? (
        <ResultsTable results={results} />
      ) : (
        <section className="border border-line bg-bg-raised/40 px-4 py-10 text-center text-sm text-fg-faint">
          <span className="text-cyan">›</span> this scan{" "}
          {state.status === "failed" || state.status === "interrupted"
            ? "did not finish — no results to show"
            : `is ${state.status}`}
        </section>
      )}
    </div>
  );
}
