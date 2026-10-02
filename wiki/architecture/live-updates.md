# Live updates: every browser talks to Coinset directly

decision-012 (2026-09-17) removed the server-side event hub, chain cache and mempool syncer that
milestone m-6 (decision-006) had built: for a small, solo-maintained project, that layer was a
second thing to operate and secure on top of Coinset itself, and Coinset has never throttled the
app's anonymous traffic. mempoolxch.space's server now only hosts the app (SSR, the Sage static
snapshot, `/up`); every browser tab opens its own connection to Coinset, the same way a custom
node or the static Sage snapshot always has.

## The pieces

| Piece           | Where                                   | What it does                                                                                                                                                                |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live stream     | `src/shared/lib/live/stream.ts`         | Browser side: the direct Coinset WebSocket (`peak`, `transaction` events), falling back to polling `get_blockchain_state` after repeated failures, with exponential backoff |
| Live provider   | `src/shared/providers/LiveProvider.tsx` | Runs the stream for the active network, invalidates the matching TanStack Query families (throttled: 1 s chain, 3 s mempool)                                                |
| Channel wording | `src/shared/lib/live/channel.ts`        | One description (`describeChannel`) shared by the connection pill, the footer and the Settings page                                                                         |

## What a browser does

| Data                                  | Coinset endpoint                                                            | Custom node                              |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------- |
| Live events                           | direct Coinset WebSocket (`wss://…/ws?events=peak,transaction`)             | polling `get_blockchain_state` every 5 s |
| State, recent blocks, fee cards       | `get_blockchain_state`, `get_block_records`, `get_fee_estimate`             | same                                     |
| Mempool summary                       | assembled client-side from `get_blockchain_state` + `get_all_mempool_items` | same                                     |
| Detail pages, search, address history | Coinset indexed API directly                                                | RPC only, indexed features hidden        |

Every one of these calls is now the same code path regardless of Coinset vs. a custom node — the
"custom node" fallback in each hook is the only path there is. Per-block asset totals
(`useBlocksAssetTotals`, `src/widgets/block/useBlock.ts`) are throttled to 3 concurrent Coinset
calls (`src/shared/lib/limit.ts`) so a dashboard load does not fire a burst of indexed requests at
once; Coinset answers a burst with an error page that carries no CORS headers, which the browser
reports as an opaque CORS failure, so this limiter matters.

## What the user sees

The connection pill (tooltip and screen-reader text), the footer and a line in Settings all name
the channel with the same words (`describeChannel`): **Coinset socket** (live, direct WebSocket),
**Polling** and **Polling (custom node)**. The Help page explains the modes.

## History

- Milestone m-6 (2026-09-16, decision-006) moved this server-side: one Coinset WebSocket per
  network, a chain cache, a mempool syncer and server-sent events to browsers. It measurably cut
  browser-to-Coinset traffic from ~39 calls/tab/min to ~0 (see [coinset-load.md](coinset-load.md)).
- decision-009 (2026-09-16) removed the Coinset API key and webhook receiver that m-6 had also
  built: the anonymous WebSocket alone proved reliable enough.
- decision-012 (2026-09-17) removed the rest of the server-side layer (event hub, chain cache,
  mempool syncer, SSE endpoint): the operating cost of a second caching layer, for a project this
  size, was judged not worth what it bought given Coinset was never actually the bottleneck.
  Every hosted-first code path already had a direct-client fallback (custom nodes, the Sage
  snapshot, a failed hosted call), so the direct path was already exercised in production and in
  tests; it is now the only path.
