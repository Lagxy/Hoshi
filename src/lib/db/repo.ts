import { freshnessCutoff } from "@/lib/cache";
import { prisma } from "./client";

// ── Repository layer ─────────────────────────────────────────────────────────
// Every database query in the app goes through this module. Keeping Prisma calls
// in one place is the seam that makes a future sqlite -> postgres swap localized.

// ── Markets cache (Stage 1) ──────────────────────────────────────────────────

export interface MarketRowInput {
  coingeckoId: string;
  rank: number | null;
  symbol: string;
  name: string;
  image: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  fdv: number | null;
  totalVolume: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
  athChangePercentage: number | null;
  pc1h: number | null;
  pc24h: number | null;
  pc7d: number | null;
  pc14d: number | null;
  pc30d: number | null;
  pc200d: number | null;
  pc1y: number | null;
  fetchedAt: Date;
}

/** Replace the entire markets snapshot atomically (refresh = new universe). */
export async function replaceMarkets(rows: MarketRowInput[]): Promise<void> {
  await prisma.$transaction([
    prisma.marketCache.deleteMany({}),
    prisma.marketCache.createMany({ data: rows }),
  ]);
}

/** Count of cached market rows + the newest fetch time (null when empty). */
export async function getMarketsMeta(): Promise<{
  count: number;
  newestFetchedAt: Date | null;
}> {
  const [count, newest] = await Promise.all([
    prisma.marketCache.count(),
    prisma.marketCache.findFirst({
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }),
  ]);
  return { count, newestFetchedAt: newest?.fetchedAt ?? null };
}

/** Top N cached tokens by market cap (highest first, nulls last). */
export function getTopMarkets(limit: number) {
  return prisma.marketCache.findMany({
    orderBy: { marketCap: "desc" },
    take: limit,
  });
}

// ── Detail cache (Stage 2 classification) ────────────────────────────────────

export interface DetailRowInput {
  coingeckoId: string;
  genesisDate: string | null;
  categories: string[];
  fetchedAt: Date;
}

/** Fresh detail rows for the given ids (within ttl). */
export function getFreshDetails(ids: string[], ttlMs: number) {
  return prisma.detailCache.findMany({
    where: {
      coingeckoId: { in: ids },
      fetchedAt: { gte: freshnessCutoff(ttlMs) },
    },
  });
}

/** Upsert one token's classification detail. */
export async function upsertDetail(row: DetailRowInput): Promise<void> {
  const categories = JSON.stringify(row.categories);
  await prisma.detailCache.upsert({
    where: { coingeckoId: row.coingeckoId },
    create: {
      coingeckoId: row.coingeckoId,
      genesisDate: row.genesisDate,
      categories,
      fetchedAt: row.fetchedAt,
    },
    update: {
      genesisDate: row.genesisDate,
      categories,
      fetchedAt: row.fetchedAt,
    },
  });
}

// ── Category list cache ──────────────────────────────────────────────────────

export async function getFreshCategories(
  ttlMs: number,
): Promise<{ categoryId: string; name: string }[] | null> {
  const newest = await prisma.categoryList.findFirst({
    orderBy: { fetchedAt: "desc" },
    select: { fetchedAt: true },
  });
  if (!newest || newest.fetchedAt < freshnessCutoff(ttlMs)) return null;
  return prisma.categoryList.findMany({
    orderBy: { name: "asc" },
    select: { categoryId: true, name: true },
  });
}

export async function replaceCategories(
  list: { categoryId: string; name: string }[],
): Promise<void> {
  const fetchedAt = new Date();
  await prisma.$transaction([
    prisma.categoryList.deleteMany({}),
    prisma.categoryList.createMany({
      data: list.map((c) => ({ ...c, fetchedAt })),
    }),
  ]);
}

// ── Scans (job state + history) ──────────────────────────────────────────────

export const ACTIVE_STATUSES = [
  "queued",
  "running_stage1",
  "running_stage2",
] as const;

export interface CreateScanInput {
  universeSize: number;
  logic: string;
  conditions: string; // JSON
}

export function createScan(input: CreateScanInput) {
  return prisma.scan.create({
    data: {
      status: "queued",
      universeSize: input.universeSize,
      logic: input.logic,
      conditions: input.conditions,
    },
  });
}

export function getScan(id: string) {
  return prisma.scan.findUnique({ where: { id } });
}

type ScanUpdate = Parameters<typeof prisma.scan.update>[0]["data"];

export function updateScan(id: string, data: ScanUpdate) {
  return prisma.scan.update({ where: { id }, data });
}

/** The single in-flight scan, if any (queued or running). */
export function getActiveScan() {
  return prisma.scan.findFirst({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    orderBy: { createdAt: "desc" },
  });
}

/** History list — newest first. Heavy `results` blob omitted. */
export function listScans(limit = 100) {
  return prisma.scan.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      universeSize: true,
      logic: true,
      conditions: true,
      resultColumns: true,
      matchedCount: true,
      errorMessage: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });
}

export function deleteScan(id: string) {
  return prisma.scan.delete({ where: { id } });
}

/** On server start, fail any scans left mid-run by a previous process. */
export async function markOrphanedScansInterrupted(): Promise<number> {
  const { count } = await prisma.scan.updateMany({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    data: {
      status: "interrupted",
      finishedAt: new Date(),
      errorMessage: "Server restarted while the scan was running.",
    },
  });
  return count;
}
