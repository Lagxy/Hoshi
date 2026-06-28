import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveSqliteUrl } from "./sqlite-path";

// Prisma 7 pairs the query compiler with a driver adapter. Pinned to globalThis so
// the dev server's HMR reuses one connection instead of leaking a new one per reload.
const globalForPrisma = globalThis as unknown as {
  __hoshiPrisma?: PrismaClient;
};

function createPrisma(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl() });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.__hoshiPrisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__hoshiPrisma = prisma;
}
