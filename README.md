# Hoshi — Personal Crypto Token Screener

A local-only web app that screens crypto tokens against custom multi-criteria
filter rules (valuation / momentum / liquidity / classification) and shows the
matches in a terminal-styled dashboard. Single user, no auth, runs on your machine.

Data comes from the **CoinGecko Demo tier**. Scans use a two-stage funnel: a cheap
bulk `/coins/markets` pull, then a per-token `/coins/{id}` pull only for the tokens
that need classification fields.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict, Tailwind v4
- Prisma 7 + SQLite (via the better-sqlite3 driver adapter) — all DB access behind
  `src/lib/db/repo.ts`, so swapping to Postgres later is a localized change
- Motion for the interface animations

## Setup

```bash
pnpm install
```

Add your CoinGecko **Demo** API key to `.env.local` (create one at
https://www.coingecko.com/en/developers/dashboard):

```
COINGECKO_API_KEY="cg-demo-..."
```

The SQLite database and schema are created by Prisma migrations:

```bash
pnpm prisma migrate dev
```

`DATABASE_URL` is preset in `.env` to `file:./hoshi.db` (resolved to
`prisma/hoshi.db`). The app reads the same file at runtime.

## Run

```bash
pnpm dev      # http://localhost:3000
pnpm build && pnpm start   # production
pnpm lint
```

## How it works

- **Universe** — pick Top 250 / 500 / 1000 / 2000 / All before scanning.
- **Rules** — a flat list of conditions (`> < >= <= between`, plus category
  multi-select), with one global AND/OR toggle.
- **Funnel** — under AND, cheap filters narrow the set before the expensive
  per-token stage; under OR, tokens already matched by a cheap filter skip the
  detail fetch.
- **Caching** — markets cached 15 min, classification detail (genesis date /
  categories) cached ~7 days since it's near-static, so only the first big scan is
  slow. Category list cached ~24h.
- **Jobs** — scans run as an in-process background job (singleton runner) tracked
  in SQLite; the UI polls every 2s. Cancel is supported, and the request pacer
  stays under the Demo tier's 100/min limit (~85/min) with 429 backoff.
- **History** — every scan is saved with its exact rules + matched tokens, and can
  be reopened or exported to CSV.
