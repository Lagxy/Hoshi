import path from "node:path";

/**
 * Normalize a SQLite `file:` URL to an absolute path.
 *
 * Why: the Prisma CLI resolves relative `file:` URLs against the schema directory,
 * while the better-sqlite3 runtime adapter resolves against `process.cwd()`. Forcing
 * an absolute path makes both agree on a single file: `<project>/prisma/<name>.db`.
 *
 * Non-`file:` URLs (e.g. a future Postgres connection string) are returned untouched,
 * so the SaaS swap is just changing DATABASE_URL + the adapter.
 */
export function resolveSqliteUrl(
  raw: string = process.env.DATABASE_URL ?? "file:./hoshi.db",
): string {
  if (!raw.startsWith("file:")) return raw;
  const p = raw.slice("file:".length);
  if (p === ":memory:") return raw;
  const abs = path.isAbsolute(p)
    ? p
    : path.join(process.cwd(), "prisma", path.basename(p));
  return `file:${abs}`;
}
