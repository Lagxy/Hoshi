# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 16 — not the Next.js in your training data

This app runs **Next.js 16.2.9 + React 19.2.4**. APIs, conventions, and file structure differ from older versions you may know. Per `AGENTS.md`:

> Read the relevant guide in `node_modules/next/dist/docs/` **before writing any code**. Heed deprecation notices.

Docs layout: `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`. Do not assume an API exists — verify in those docs.

## Repository layout

Single Next.js 16 app at the repo root (App Router). Backend logic lives in Route Handlers under `src/app/api/` plus libraries in `src/lib/`; persistence via Prisma (`prisma/`). No separate backend service.

## Commands

Package manager is **pnpm**. Run from the repo root:

| Task | Command |
|------|---------|
| Dev server (localhost:3000) | `pnpm dev` |
| Production build | `pnpm build` |
| Serve prod build | `pnpm start` |
| Lint | `pnpm lint` |

No test runner is configured yet.

## Stack specifics

- **App Router** — source under `src/app/` (`layout.tsx` = root layout, `page.tsx` = route). No `pages/` dir.
- **React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`, via `babel-plugin-react-compiler`). Don't hand-add `useMemo`/`useCallback` for referential-stability reasons the compiler already handles.
- **Tailwind v4** — CSS-first config. Theme tokens declared in `src/app/globals.css` via `@import "tailwindcss"` + `@theme inline`, not a `tailwind.config.js`.
- **TypeScript strict**, path alias `@/*` → `src/*`.
- **ESLint flat config** (`eslint.config.mjs`) extending `eslint-config-next` core-web-vitals + typescript.
- Fonts: Geist / Geist Mono via `next/font/google`, exposed as `--font-geist-sans` / `--font-geist-mono`.
</content>
</invoke>
