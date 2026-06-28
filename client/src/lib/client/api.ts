import type {
  HistoryItemDTO,
  ScanResultsDTO,
  ScanStateDTO,
} from "@/lib/scan/serialize";
import type { Condition, Logic } from "@/lib/scan/types";

export interface CategoryOption {
  id: string;
  name: string;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface StartScanInput {
  universeSize: number;
  logic: Logic;
  conditions: Condition[];
}

export async function startScan(input: StartScanInput): Promise<{ id: string }> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function getActiveScan(): Promise<ScanStateDTO | null> {
  const res = await fetch("/api/scan", { cache: "no-store" });
  const data = await asJson<{ active: ScanStateDTO | null }>(res);
  return data.active;
}

export async function getScanState(id: string): Promise<ScanStateDTO> {
  return asJson(await fetch(`/api/scan/${id}`, { cache: "no-store" }));
}

export async function cancelScan(id: string): Promise<void> {
  await asJson(await fetch(`/api/scan/${id}/cancel`, { method: "POST" }));
}

export async function getResults(id: string): Promise<ScanResultsDTO> {
  return asJson(await fetch(`/api/scan/${id}/results`, { cache: "no-store" }));
}

export async function deleteScan(id: string): Promise<void> {
  await asJson(await fetch(`/api/scan/${id}`, { method: "DELETE" }));
}

export async function getHistory(): Promise<HistoryItemDTO[]> {
  const data = await asJson<{ scans: HistoryItemDTO[] }>(
    await fetch("/api/history", { cache: "no-store" }),
  );
  return data.scans;
}

export async function getCategories(): Promise<CategoryOption[]> {
  const data = await asJson<{ categories: CategoryOption[] }>(
    await fetch("/api/categories", { cache: "no-store" }),
  );
  return data.categories;
}
