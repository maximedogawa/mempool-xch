# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Repository layout

Mempool.xch is split across sibling repositories checked out next to each other:

| Path | Repo | Contents |
| --- | --- | --- |
| `.` | `mempool-xch` | Application code |
| `../mempool-xch-backlog` | `mempool-xch-backlog` | Memo, concept, tasks, milestones and decisions (Backlog.md) |
| `../mempool-xch-wiki` | `mempool-xch-wiki` | Documentation (architecture, data sources, deployment, guides) |

This repo holds code only. Work items belong in the backlog; explanatory docs belong in the wiki.

## What the project is

A mempool.space-style explorer for the Chia (XCH) network: projected next blocks, recent blocks,
fee estimates, mempool graphs, and search for transactions, blocks, addresses, coins and assets.
Data comes from the public Coinset full-node RPC and indexed API (no own node required), with a
settings page for a custom or local node. It also packages as a Sage wallet in-app app. Read
`../mempool-xch-backlog/Concept.md` (and `Memo.md`, the original German voice memo) first, then
the decisions under `../mempool-xch-backlog/.backlog/decisions/` (decision-004 describes the
runtime: Next.js, server-side mempool summary API, Docker image deployed via ONCE, Sage export).

## Stack and conventions

- Next.js App Router, React 19, TypeScript strict, Tailwind 4 (tokens in `src/app/globals.css`),
  TanStack Query, bun for scripts and unit tests, Playwright for e2e, Prettier + ESLint flat config.
- `bun run build` = standalone server (Docker). `SAGE_BUILD=1` (`bun run build:sage`) = static
  export for Sage: no route handlers, no rewrites, detail pages read their id from `?id=`.
  Pretty URLs (`/tx/<id>`) are rewrites onto the query-param pages; always build links with
  the `href` helpers in `src/shared/lib/routes.ts`, never hard-code either form.
- Layers: `src/app` (routes), `src/widgets` (dashboard and page sections), `src/features`
  (search, settings), `src/shared` (config, lib, ui primitives, providers), `src/server`
  (mempool summary service used by the API route).
- Amounts are `bigint` mojos end to end; format only at the edge with `src/shared/lib/chia`.
- Unit tests live next to the code as `*.test.ts` and must not touch the network (the bun test
  preload throws on `fetch`). Recorded Coinset fixtures live in `src/test-utils/fixtures`.
- No code, SVG or CSS from the mempool.space repository (AGPL): visual reference only.

## Tasks and milestones — `../mempool-xch-backlog`

Tasks and milestones are tracked with the [Backlog.md](https://github.com/MrLesk/Backlog.md) CLI.
Run `backlog` commands **from `../mempool-xch-backlog`**, not from this repo:

```bash
cd ../mempool-xch-backlog && backlog task list --plain
cd ../mempool-xch-backlog && backlog task 1 --plain
cd ../mempool-xch-backlog && backlog milestone list --plain
cd ../mempool-xch-backlog && backlog search "fee" --plain
```

At the start of a conversation that touches backlog work, run `backlog instructions overview`
first, and the matching detailed guide before lifecycle actions (`task-creation`,
`task-execution`, `task-finalization`). Never edit the markdown files under
`../mempool-xch-backlog/.backlog/` by hand; use the CLI. Milestones define delivery order.

## Reference project

`../../pengui/pengui` (with `pengui-backlog` and `pengui-wiki`) is the sibling Chia app by the same
author. Its Sage packaging (`pengui-wiki/architecture/sage-in-app-integration.md`,
`pengui/scripts/sage/`) and ONCE deployment (`pengui/deployment/README.md`) are the templates
used here.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
