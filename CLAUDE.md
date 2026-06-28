# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 16 — not the Next.js in your training data

`client/` runs **Next.js 16.2.9 + React 19.2.4**. APIs, conventions, and file structure differ from older versions you may know. Per `client/AGENTS.md`:

> Read the relevant guide in `client/node_modules/next/dist/docs/` **before writing any code**. Heed deprecation notices.

Docs layout: `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`. Do not assume an API exists — verify in those docs.

## Repository layout

Monorepo with two top-level dirs:

- `client/` — Next.js 16 frontend (App Router, all real code lives here). This is also where the git repo is (`client/.git`); the repo **root is not a git repo**. Run git commands from `client/`.
- `server/` — empty placeholder, no backend yet.

## Commands

Package manager is **pnpm**. Run from `client/`:

| Task | Command |
|------|---------|
| Dev server (localhost:3000) | `pnpm dev` |
| Production build | `pnpm build` |
| Serve prod build | `pnpm start` |
| Lint | `pnpm lint` |

No test runner is configured yet.

## Stack specifics

- **App Router** — source under `client/src/app/` (`layout.tsx` = root layout, `page.tsx` = route). No `pages/` dir.
- **React Compiler is enabled** (`reactCompiler: true` in `next.config.ts`, via `babel-plugin-react-compiler`). Don't hand-add `useMemo`/`useCallback` for referential-stability reasons the compiler already handles.
- **Tailwind v4** — CSS-first config. Theme tokens declared in `src/app/globals.css` via `@import "tailwindcss"` + `@theme inline`, not a `tailwind.config.js`.
- **TypeScript strict**, path alias `@/*` → `client/src/*`.
- **ESLint flat config** (`eslint.config.mjs`) extending `eslint-config-next` core-web-vitals + typescript.
- Fonts: Geist / Geist Mono via `next/font/google`, exposed as `--font-geist-sans` / `--font-geist-mono`.

## Note on `client/CLAUDE.md`

`client/CLAUDE.md` is `@AGENTS.md` — it imports the Next.js 16 warning above. Keep that pointer intact.
