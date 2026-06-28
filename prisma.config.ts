import path from "node:path";
import { defineConfig } from "prisma/config";
import { resolveSqliteUrl } from "./src/lib/db/sqlite-path";

// Prisma 7 moved the connection URL out of schema.prisma into this config file.
// Migrate/introspect use the datasource url below; the runtime PrismaClient uses
// the better-sqlite3 adapter (src/lib/db/client.ts). Both resolve the same
// absolute SQLite file via resolveSqliteUrl().
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: resolveSqliteUrl(),
  },
});
