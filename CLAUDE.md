# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm --filter @workspace/api-server run dev` — run the API server (builds then starts; requires `PORT` env var)
- `pnpm --filter @workspace/formation-board run dev` — run the formation-board app (requires `PORT` and `BASE_PATH` env vars)
- `pnpm run typecheck` — full typecheck: `lib/*` project references via `tsc --build`, then each package under `artifacts/*` (and `scripts`, if present) via its own `typecheck` script
- `pnpm run build` — typecheck, then build every package that has a `build` script
- `pnpm --filter @workspace/api-spec run codegen` — regenerate `lib/api-client-react` and `lib/api-zod` from `lib/api-spec/openapi.yaml` via Orval, then re-typechecks the libs
- `pnpm --filter @workspace/db run push` / `push-force` — push Drizzle schema changes to Postgres (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (only needed by `lib/db`/`api-server`)
- Package manager is enforced: the root `preinstall` script fails (and deletes `package-lock.json`/`yarn.lock`) if it detects npm/yarn instead of pnpm.

There is no test runner or lint script configured anywhere in the workspace yet.

## Architecture

This is a pnpm workspace with two package groups (`pnpm-workspace.yaml`): `artifacts/*` (deployable apps) and `lib/*` (shared libraries, referenced from `artifacts/*` as `@workspace/*` via `workspace:*`). Dependency versions shared across packages live in the `catalog:` section of `pnpm-workspace.yaml` rather than being pinned per-package.

Each folder under `artifacts/` is a Replit-managed deployable service: its `.replit-artifact/artifact.toml` defines the dev/production run commands, port, and (for web artifacts) a `BASE_PATH`. Vite-based artifacts and `api-server` all read `PORT` from `process.env` and throw on startup if it's missing — when running commands outside Replit's own orchestration, set `PORT` (and `BASE_PATH` for Vite artifacts) manually.

- **`artifacts/formation-board`** is the actual product: a single-page football tactics board (Vite + React + wouter + Radix UI + Tailwind). Almost all app logic lives in one file, [App.tsx](artifacts/formation-board/src/App.tsx) — formation/player state, drag-to-reposition players, and a tactical-arrow drawing tool (solid/dashed/curved, with bend computed from the drag path). All editorial copy (formation write-ups, manager/era history, fun facts) is kept separate in [formation-content.ts](artifacts/formation-board/src/formation-content.ts), keyed by formation name or era id, so content can be edited without touching UI code. Shirt-number and role-name lookups are static maps at the top of `App.tsx`.
- **`artifacts/api-server`** is an Express 5 app (`src/app.ts` wires middleware + `src/routes`, `src/index.ts` starts the listener). Currently only exposes `GET /api/healthz` ([routes/health.ts](artifacts/api-server/src/routes/health.ts)), validated against a Zod schema generated from the OpenAPI spec. Built with a custom esbuild script ([build.mjs](artifacts/api-server/build.mjs)) into a single ESM bundle (`dist/index.mjs`), with a long externals list for native/unbundleable packages and a banner that polyfills `require`/`__dirname` for CJS deps pulled into the ESM bundle.
- **`artifacts/mockup-sandbox`** is a Replit-internal dev tool, not part of the shipped product: a Vite plugin ([mockupPreviewPlugin.ts](artifacts/mockup-sandbox/mockupPreviewPlugin.ts)) glob-watches `src/components/mockups/**/*.tsx` (skipping files/dirs starting with `_`) and codegens `src/.generated/mockup-components.ts`, a lazy-import map. The app serves `/preview/<ComponentName>` routes that dynamically load and render one discovered component in isolation.
- **API contract flow**: [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml) is the source of truth (do not rename the `info.title` — import paths depend on it). Orval codegen (`lib/api-spec` `codegen` script) generates `lib/api-client-react` (React Query hooks) and `lib/api-zod` (Zod schemas, used by `api-server` to validate responses) into their `src/generated/` folders — treat those as build output, edit the spec instead.
- **`lib/db`** wraps Drizzle ORM over `pg` (`src/index.ts` creates the pool/db client from `DATABASE_URL`). `src/schema/index.ts` is currently an empty scaffold; its header comment documents the intended convention — one file per table, each exporting the `pgTable` definition, a `drizzle-zod` insert schema, and inferred types.
- TypeScript project references: `tsconfig.json` at the repo root references `lib/db`, `lib/api-client-react`, `lib/api-zod` and builds them with `tsc --build` (`typecheck:libs`). Packages under `artifacts/*` are not part of that reference graph — they're typechecked independently (`pnpm -r --filter "./artifacts/**"`).
- `attached_assets/` (repo root) holds pasted-in reference material; it's exposed to Vite artifacts via the `@assets` alias.
