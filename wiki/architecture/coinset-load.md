# Is polling Coinset sustainable?

Research note, 2026-09-15. Question: is the app's traffic to Coinset heavy, and is relying on
it feasible long term?

## What Coinset offers and promises

- Public full-node RPC and indexed API on `api.coinset.org` behind Cloudflare, regional
  backends (`x-region: zrh` seen from Europe), no published rate limits and no rate-limit
  headers on responses.
- The OpenAPI spec defines bearer API keys (`Authorization: Bearer cs_<key_id>_<secret>`) and a
  `429 Rate limited` response on every endpoint, and `push_tx` has an explicit rate-limited
  response. So limits exist "when enabled" and keyed access is the intended path for heavier
  or identified consumers.
- A burst of ten `get_blockchain_state` calls from one client answered in 105–155 ms each with
  no throttling.
- No published terms of service or pricing page was found on coinset.org at the time of writing
  (`/docs` exists, `/pricing`, `/faq`, `docs.coinset.org` do not).

## What the app actually sends

Measured on the dashboard with the WebSocket live, before the tuning below (per open tab):

| Target                                             | Calls / min  | Note                                                      |
| -------------------------------------------------- | ------------ | --------------------------------------------------------- |
| `/api/<network>/mempool` (our server, not Coinset) | 29           | ~180 KB each with 110 dust-style items → 5 MB/min per tab |
| `get_blockchain_state`                             | 7            | LiveProvider poll every 15 s + 20 s query interval        |
| `get_fee_estimate`                                 | 3.5          |                                                           |
| `get_block_records`                                | 2.5          | per new peak                                              |
| WebSocket                                          | 1 connection | peak + transaction events                                 |

Server side, per network, while any client was active in the last two minutes:
`get_blockchain_state` + `get_all_mempool_tx_ids` every 3 s (40 calls/min, a few KB each) plus
one `get_mempool_item_by_tx_id` per newly seen bundle (~11/min on mainnet today). The server
never downloads `get_all_mempool_items` (17 MB) in steady state.

So Coinset sees roughly **13 calls/min per browser tab plus 50 calls/min per server**, all tiny
(state, ids, fee estimate, a window of block records). That is light compared with a single
wallet sync, and it is dominated by our own server, which is a single, shared consumer.

## Tuning applied (same day)

- Summary payload: coins per item capped at 6 instead of 16 (worst-case item 1.6 KB instead of
  3.2 KB), so a busy mempool summary is ~60 KB. Next.js compresses responses (`compress: true`).
- Summary refetch every 12 s while the WebSocket is live (events already invalidate it),
  4 s only while polling.
- `get_blockchain_state` safety-net interval 60 s (LiveProvider's poll keeps the cache fresh),
  fee estimate every 45 s.
- Server syncer backs off for 30 s on HTTP 429.
- Per-block `get_block_transactions` calls (one per recent block cube and per row of the
  blocks list) go through a 3-wide limiter per tab (`src/shared/lib/limit.ts`). A dashboard
  load used to fire them all at once; Coinset answered the burst with an error page that has
  no CORS headers, which the browser reports as a CORS failure. Milestone m-6 (TASK-034) moves
  these statistics to the server so the browser stops calling the indexed API per block.

After tuning a tab costs Coinset about **5 calls/min** and our server about 60 KB per summary.

## Measured after milestone m-6 (2026-09-16)

Method: local production build, one Playwright tab on the dashboard for 3 minutes, browser
requests counted per host, server-side Coinset calls read from the new meter on
`/api/<network>/status` before and after the window. Three runs.

|                                                        | Before m-6 tuning (same day)                                                                                                                     | After                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Coinset calls per browser tab per minute               | 39.3 (108 `get_block_transactions` in 3 min: every peak invalidated the whole chain query root, so all recent-block asset totals were refetched) | **0** (runs: 2.7, 0, 0)                                                                 |
| Hosted requests per tab per minute                     | 67 (56 mempool summaries)                                                                                                                        | 38 (22 summaries of ~60 KB, 14 chain snapshots of ~40 KB)                               |
| Server Coinset calls per minute, any number of viewers | 21                                                                                                                                               | 22 (15 mempool item fetches, 3.3 state, 1.3 block records, 1 fee, 1 block transactions) |

What changed to get there: peaks invalidate only state and fees; event bursts are throttled
(1 s chain, 3 s mempool); the "filling" fast poll is capped; the shared chain fetch no longer
dies with the first caller's abort signal; the server's chain cache fetches each transaction
block's asset totals once (2 in flight, 90 s back-off on failure) and announces readiness with
a `chain` event, so every tab refetches its window and totals exactly once; the safety poll no
longer downgrades a live stream.

Still worth doing: the mempool summary is refetched up to 20 times a minute per tab while
Coinset is busy (each ~60 KB); pushing the compact items over the event stream instead would
cut that to near zero. Tracked as a follow-up in the backlog.

## Long-term options, in order

1. **Stay on Coinset, add an API key.** The spec already supports keys; ask Coinset for one for
   the hosted deployment and pass it from the server (`MEMPOOL_COINSET_API_KEY`, never in the
   browser). Cheap, keeps everything else unchanged.
2. **Move more traffic behind our server.** Done in milestone m-6 (TASK-033, TASK-034): one
   Coinset WebSocket per network on the server, server-sent events to browsers, and
   `/api/<network>/chain` for state, recent blocks and fees, so Coinset sees one consumer per
   network regardless of viewer count. See [live-updates.md](live-updates.md).
3. **Run a Chia full node next to the app** (`chia` in a second ONCE app, ~100 GB SSD, several
   hours to sync, ~2 GB RAM). The server-side syncer already accepts any full-node RPC
   (`MEMPOOL_RPC_URL_<NETWORK>`), so the mempool, blocks, coins and fee estimates would come
   from our own node with zero third-party dependency. Coinset would still be needed for the
   semantic transaction summaries, address history and CAT/NFT pages, which the app already
   hides gracefully when unavailable.
4. **Replace the indexed features** with a self-hosted indexer if Coinset ever disappears; that
   is a project of its own and out of scope today.

Recommendation: 1 now, 2 when viewer counts grow, 3 when the hosted node is wanted for
independence. The code paths for all three exist or are small.

**Update, 2026-09-16 (decision-009):** option 1 was built (milestone m-7, `COINSET_API_KEY`
plus a webhook receiver) and then removed the same day. The anonymous WebSocket from option 2
turned out to already be reliable on its own (verified: connects once, stays connected, live
within about a second, no reconnects observed), so the key never had a WebSocket to identify
(it only ever touched the plain HTTP RPC calls) and the webhook's extra push channel and public
receiver weren't earning their complexity. The app is back to fully anonymous Coinset access;
option 1 stays available to revisit if Coinset ever actually rate-limits anonymous traffic.

**Update, 2026-09-17 (decision-012):** option 2 (move traffic behind the server) was also
reversed, this time fully — not just the key/webhook layer, but the WebSocket hub, chain cache,
mempool syncer and SSE endpoint that milestone m-6 built on top of it. Prompted by scoping
TASK-082 (a further server-side proxy for detail-page reads): for a small, solo-maintained
project, every one of these server layers was judged a second thing to operate and secure on top
of Coinset itself, for a problem (Coinset throttling) that has never actually happened. The app
is back to option "0": every browser talks to Coinset directly, the way a custom node always did.
The one piece kept from the server-side design rather than dropped outright: the mempool summary
still syncs incrementally (id list, then only new items) instead of re-fetching the full,
multi-MB `get_all_mempool_items` on every tick — just running per browser tab now
(`src/shared/lib/mempool/sync.ts`) instead of once on the server. See
[live-updates.md](live-updates.md) for the current architecture.

## Update, 2026-09-20 (TASK-093): the throttling did happen

Decision-012 assumed Coinset throttling "has never actually happened". It now has, reported from
production as a CORS error on `get_block_transactions`. There is no CORS misconfiguration: from
`https://mempoolxch.space`, a successful response and the `OPTIONS` preflight both carry
`access-control-allow-origin: *`. What has no CORS headers at all is Coinset's **failure**
response — a `503` `upstream connect error…` or a `429` — and a browser cannot read a response it
was not allowed to see, so it reports every throttled request as a CORS failure. The stack trace
points at whichever caller was unlucky, which is why this looked like a code bug.

Error rate scales with how many requests are in flight at once (measured against
`api.coinset.org`, 2026-09-20):

| Concurrent requests | Sent | Failures          |
| ------------------- | ---- | ----------------- |
| 3                   | 60   | 0                 |
| 7                   | 140  | 1 × 503           |
| 11                  | 240  | 5 × 503           |
| 150 (burst)         | 150  | 27 × 503, 5 × 429 |

A dashboard load was sending about 11 at once: 8 ungated mempool-item fetches from the per-tab
syncer next to the 3-wide indexed limiter. The per-widget limiters (block totals 3, charts 4,
pools 3, prefarm 3, token scan 6) each bounded themselves and nothing bounded the total.

What changed:

- **One budget for the whole tab.** `src/shared/lib/rpc/readGate.ts` now gates _all_ Coinset
  traffic, full-node RPC and indexed API alike, at 5 in flight, with a shared cooldown (1 s then
  3 s) that every caller waits on after any 503/429/network failure, and one bounded retry.
  `push_tx` is deliberately excluded — a lost answer does not mean the bundle was rejected, and a
  replay could double-spend. A custom node is never gated.
- **Block asset totals are cached in localStorage** by header hash
  (`src/shared/lib/blocks/totalsCache.ts`). A block's transactions never change, so a reload
  stops re-asking for blocks it has already seen; only new blocks cost a call.
- **The tokens page stopped calling Coinset entirely.** It used to spend two
  `get_transactions_by_cat_asset_id` calls per row (50 per page, up to 500 for a sort scan) to
  show a sampled token-amount "volume" that could not be compared between tokens. It now reads
  one Dexie tickers request for every token at once. A measured `/tokens` load makes **2** Coinset
  requests, both the ordinary chain-state poll.
- **MintGarden NFT records are fetched once per NFT** for all callers, misses included, so an NFT
  that is not indexed no longer costs one 404 per component showing it.

What this does not fix: an occasional 503 can still surface, because Coinset sometimes fails even
at low concurrency. The app retries and the data still loads. Only Coinset can make the message
itself disappear, by sending CORS headers on its error responses — worth reporting upstream.
