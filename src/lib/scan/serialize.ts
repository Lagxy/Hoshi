import type { ResultColumn, ResultRow } from "./columns";
import type { Condition, Logic } from "./types";

/** Public scan state (polled by the UI). Excludes the heavy results blob. */
export interface ScanStateDTO {
  id: string;
  status: string;
  stage: string | null;
  universeSize: number;
  logic: Logic;
  conditions: Condition[];
  progressCurrent: number;
  progressTotal: number;
  etaSeconds: number | null;
  matchedCount: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

/** Full results payload (matched rows + dynamic columns). */
export interface ScanResultsDTO {
  id: string;
  status: string;
  universeSize: number;
  logic: Logic;
  conditions: Condition[];
  matchedCount: number;
  columns: ResultColumn[];
  rows: ResultRow[];
}

export interface HistoryItemDTO {
  id: string;
  status: string;
  universeSize: number;
  logic: Logic;
  conditions: Condition[];
  matchedCount: number;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export function parseConditions(json: string | null): Condition[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as Condition[]) : [];
  } catch {
    return [];
  }
}

function parseColumns(json: string | null): ResultColumn[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as ResultColumn[]) : [];
  } catch {
    return [];
  }
}

function parseRows(json: string | null): ResultRow[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? (v as ResultRow[]) : [];
  } catch {
    return [];
  }
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

interface ScanRowState {
  id: string;
  status: string;
  stage: string | null;
  universeSize: number;
  logic: string;
  conditions: string;
  progressCurrent: number;
  progressTotal: number;
  etaSeconds: number | null;
  matchedCount: number;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export function toScanState(scan: ScanRowState): ScanStateDTO {
  return {
    id: scan.id,
    status: scan.status,
    stage: scan.stage,
    universeSize: scan.universeSize,
    logic: scan.logic as Logic,
    conditions: parseConditions(scan.conditions),
    progressCurrent: scan.progressCurrent,
    progressTotal: scan.progressTotal,
    etaSeconds: scan.etaSeconds,
    matchedCount: scan.matchedCount,
    errorMessage: scan.errorMessage,
    createdAt: scan.createdAt.toISOString(),
    startedAt: iso(scan.startedAt),
    finishedAt: iso(scan.finishedAt),
  };
}

interface ScanRowResults {
  id: string;
  status: string;
  universeSize: number;
  logic: string;
  conditions: string;
  matchedCount: number;
  resultColumns: string | null;
  results: string | null;
}

export function toScanResults(scan: ScanRowResults): ScanResultsDTO {
  return {
    id: scan.id,
    status: scan.status,
    universeSize: scan.universeSize,
    logic: scan.logic as Logic,
    conditions: parseConditions(scan.conditions),
    matchedCount: scan.matchedCount,
    columns: parseColumns(scan.resultColumns),
    rows: parseRows(scan.results),
  };
}

interface HistoryRow {
  id: string;
  status: string;
  universeSize: number;
  logic: string;
  conditions: string;
  matchedCount: number;
  errorMessage: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export function toHistoryItem(scan: HistoryRow): HistoryItemDTO {
  return {
    id: scan.id,
    status: scan.status,
    universeSize: scan.universeSize,
    logic: scan.logic as Logic,
    conditions: parseConditions(scan.conditions),
    matchedCount: scan.matchedCount,
    errorMessage: scan.errorMessage,
    createdAt: scan.createdAt.toISOString(),
    startedAt: iso(scan.startedAt),
    finishedAt: iso(scan.finishedAt),
  };
}
