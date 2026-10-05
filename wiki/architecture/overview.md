# Architecture overview

mempoolxch.space is a Next.js (App Router) + React 19 + TypeScript app managed with bun. One code
base produces two outputs (backlog decision-004):

| Output            | Command                               | Serves                                                                                                                                                                             |
| ----------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Standalone server | `bun run build`                       | The hosted site and the Sage snapshot (Docker image, see [deployment](../deployment/docker-once.md)); every browser talks to Coinset, Dexie and MintGarden directly (decision-012) |
| Static export     | `bun run build:sage` (`SAGE_BUILD=1`) | The Sage wallet in-app snapshot: no server, no rewrites, every page a real `.html` file                                                                                            |

## Layers

```
src/app        routes (dashboard, tx, block, address, coin, cat, nft, blocks, mempool, wallet, settings, docs, /up)
src/widgets    page sections: blocks row, fee cards, block time, mempool stats, next-block goggles, feeds, shell, wallet (Sage), detail-page widgets
src/features   search (input recognition + probing), settings form
src/shared     config (networks), lib (chia helpers, rpc client, mempool packing/classify/history/sync,
               live stream, settings store, routes), ui primitives, providers, api hooks
scripts/sage   Sage snapshot pipeline (copied and adapted from Pengui)
tests/e2e      Playwright suites against a mocked Coinset
```

There is no `src/server`: decision-012 (2026-09-17) removed every server-side cache/proxy for
third-party reads. The server hosts the app and nothing else.

## Routes

Detail pages are query-param pages (`/tx?id=…`, `/block?id=…`, `/address?id=…`, `/coin?id=…`,
`/cat?id=…`, `/nft?id=…`). The hosted server rewrites the pretty mempool.space-style URLs
(`/tx/<id>`) onto them in `next.config.ts`; the static export links to the query form directly
because Sage serves only files. `src/shared/lib/routes.ts` builds every link, so pages never
hard-code either form. List pages: `/blocks`, `/mempool`. Utility: `/settings`, `/docs`, `/up`
(ONCE health check).

## Data layer

- `src/shared/lib/rpc/client.ts` is the single seam to the chain: a typed client over the Chia
  full-node RPC (`POST <base>/<method>`) and the Coinset indexed API. Responses go through a
  precision-safe JSON parser (16+ digit integers become `bigint`) and normalisers that produce
  domain models with `bigint` mojos and unprefixed lowercase hex ids.
- TanStack Query owns caching. Query keys are namespaced (`["chain", network, …]`,
  `["mempool", network, …]`, `["tx", network, id]`, `["address", network, …]`) so live events can
  invalidate whole families.
- `SettingsProvider` resolves the active network's endpoints (Coinset by default, custom RPC
  URL per network) and hands out one `RpcClient`.
- `LiveProvider` runs the live stream (below) and invalidates queries.

## Live updates

Every browser opens its own direct Coinset WebSocket (`src/shared/lib/live/stream.ts`,
exponential backoff 1 s → 30 s), falling back to polling `get_blockchain_state` after repeated
failures or for a custom node. The header indicator shows Live / Polling / Connecting / Offline
with the last-update age. Full picture in [live-updates.md](live-updates.md).

## Projected blocks

See [projected-blocks.md](projected-blocks.md): pending spend bundles are packed by fee per
CLVM cost into blocks bounded by `block_max_cost`, client-side, from the compact summary.

## Asset registry

CAT metadata comes straight from Dexie's CAT list; the client fetches it once at startup through
TanStack Query (`AssetRegistryLoader`, `useTokenList`, `staleTime: Infinity`) and every component
reads assets by id with `useAsset(assetId)`.

## Mempool summary

`get_all_mempool_items` is ~17 MB on mainnet because it carries puzzle reveals, so the browser
never re-fetches it wholesale: `src/shared/lib/mempool/sync.ts` fetches the id list and only the
items not already known, keeping a running map per network for the tab's lifetime — the same
incremental approach the removed server-side syncer used, just running client-side
(decision-012). `useMempoolSummary` (`src/shared/api/hooks.ts`) wraps it into the compact summary
the dashboard reads.

## Security headers

The hosted (standalone) build sends `Content-Security-Policy`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff` and a `Permissions-Policy`
that turns off camera, microphone, geolocation, payment, USB and MIDI on every route, in
production only (`next.config.ts`, TASK-050). The CSP comes from the same builder as the Sage
snapshot's (`scripts/sage/csp.ts`), with three documented departures:

- `connect-src 'self' https: wss:` plus `http://localhost:*` / `127.0.0.1` rather than a host
  list, because Settings accepts any custom node URL and tells own-node users to run a local
  CORS proxy. A static header cannot know that URL in advance.
- `script-src` allows `'unsafe-inline'` for Next's inline bootstrap scripts. The Sage export
  strips those at build time; the live server would need a per-request nonce instead, which is
  the known follow-up. The app has no `dangerouslySetInnerHTML`.
- `prefetch-src` is dropped: Chrome removed it and logs it as an error on every page.

`img-src` is not broadened: it is `'self' blob: data:` plus `TRUSTED_IMAGE_HOSTS` from
`src/shared/lib/trustedImage.ts`, the same allowlist the components enforce (TASK-051), so the
two cannot drift. Covered by `src/shared/lib/hostedCsp.test.ts` and
`tests/e2e/security-headers.spec.ts` (headers present, zero CSP violations); checked once in a
real browser against live Coinset on 2026-09-17 (images, WebSocket and every list page clean).

## Design

Details in [design.md](design.md).
Original implementation modelled on mempool.space's layout (decision-003): dark navy tokens with
the accent shifted to Chia green, fee-band gradient green → yellow → red, block "cubes" with a
skewed side face. All colours are CSS variables in `src/app/globals.css` mapped into Tailwind 4
via `@theme`; `[data-theme="light"]` flips the surfaces. No code, SVG or CSS was taken from the
AGPL mempool frontend.
