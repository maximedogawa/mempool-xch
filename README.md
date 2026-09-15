# Mempool.xch

**Mempool.xch is a [mempool.space](https://mempool.space)-style explorer for the Chia (XCH) network.**
It shows the live mempool as projected next blocks, the most recent confirmed blocks, fee
estimates and mempool graphs, and lets you search for transactions (spend bundles), blocks,
addresses, coins, CATs and NFTs. Data comes from the public [Coinset](https://coinset.org)
full-node RPC and indexed API, so no own node is required, with a settings page to point the
app at a custom or local node instead.

The app is a Next.js + React + TypeScript project managed with bun. One code base produces two
outputs: a standalone server shipped as a Docker image and deployed via
[ONCE](https://github.com/basecamp/once), and a static snapshot that installs directly into the
[Sage wallet](https://github.com/xch-dev/sage) as an in-app app. The server keeps a compact,
incrementally synced view of the mempool so phones never download raw spend bundles.

## Related repositories

| Repo | Contents |
| --- | --- |
| [mempool-xch-backlog](https://github.com/maximedogawa/mempool-xch-backlog) | Original memo, [Concept.md](https://github.com/maximedogawa/mempool-xch-backlog/blob/main/Concept.md), tasks, milestones and decisions (Backlog.md) |
| [mempool-xch-wiki](https://github.com/maximedogawa/mempool-xch-wiki) | Architecture, data sources, deployment, Sage install and custom-node guides |

## Development

```bash
bun install
bun run dev          # http://localhost:3000
bun run type-check
bun run lint
bun run test         # bun unit tests (no network)
bun run test:e2e     # Playwright against a mocked Coinset
bun run build        # standalone server (.next/standalone)
bun run build:sage   # Sage snapshot (out/)
```

## Deployment

`docker compose up --build` serves the production image on http://localhost:8080. Production runs
the same image under ONCE: see [deployment/README.md](deployment/README.md).

## Licence

MIT. The mempool.space frontend is AGPL and was used as a visual reference only; no code, assets
or stylesheets were copied (see decision-003 in the backlog).
