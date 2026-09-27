# Custom or local node

Settings → Full-node RPC endpoints accepts any Chia full-node RPC over HTTPS (or plain HTTP on
localhost). With a custom endpoint the app polls `get_blockchain_state` instead of streaming,
fetches the raw mempool in the browser, and hides Coinset-only features (semantic transaction
summaries, address history, CAT and NFT history).

## Why a stock node does not work directly

A Chia full node listens on `https://localhost:8555` with **mutual TLS**: clients must present
the node's client certificate, which browsers cannot do. It also sends no CORS headers, so a
page served from another origin cannot call it. A small reverse proxy fixes both.

## Built-in dev proxy (no Caddy or nginx needed)

For a node on the same machine the repository ships a small proxy:

```sh
bun run node:proxy                          # http://127.0.0.1:8556 → https://localhost:8555
bun run node:proxy --port 9000 --node https://localhost:58555
CHIA_ROOT=~/.chia/testnet11 bun run node:proxy
```

It presents the node's own client certificate from `$CHIA_ROOT/config/ssl/full_node`
(default `~/.chia/mainnet`) and adds CORS. It is deliberately narrower than the Caddy and
nginx examples below:

- it listens on `127.0.0.1` only;
- it forwards only the RPC methods the app uses (`src/shared/lib/node/methods.ts`), so
  `stop_node`, `close_connection` and the other admin methods stay closed;
- it answers only pages from `localhost` or `https://mempoolxch.space`, so another site open in
  the same browser cannot drive your node;
- it logs method, status and time, never request bodies or key material.

Then enter `http://127.0.0.1:8556` in Settings and press _Test connection_.

> **Use `127.0.0.1`, not `localhost`.** The proxy listens on the IPv4 loopback address only.
> Browsers and the OS may resolve `localhost` to IPv6 `::1` first, where nothing listens, so
> `http://localhost:8556` can fail with a network error while `http://127.0.0.1:8556` works.

## Checking a node: `bun run node:probe`

```sh
bun run node:probe                          # the dev proxy
bun run node:probe https://node.example:8556
```

The probe calls every standard full-node method the app uses, through the app's own RPC client,
with parameters taken from the node itself (its peak, its newest transaction block, a coin that
block spent). It prints ok or FAIL and the latency per method, skips `push_tx` (it would
broadcast), lists the Coinset-only methods as unavailable, and exits 1 when a standard method
fails.

## Tested against a real, syncing node (2026-09-27)

A mainnet node on macOS through the dev proxy, still in sync mode at 99.7 %
(peak 9,330,579 of 9,350,823):

| Area                                                                               | Result                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chain state, network space, fee estimate, block records, full blocks, block spends | answer in 1–50 ms                                                                                                                                                                          |
| Coin records by name, names, parent ids, puzzle hash, hint; puzzle and solution    | answer in 1–255 ms                                                                                                                                                                         |
| Mempool (`get_all_mempool_tx_ids`, `get_all_mempool_items`, by coin name)          | answer, but empty: a syncing node keeps no mempool                                                                                                                                         |
| `get_additions_and_removals`                                                       | **never answers while the node syncs** (nothing after 150 s, for the peak and for blocks 1,000 or 30,000 back); `get_coin_records_by_puzzle_hash` over a wide height range took about 20 s |
| Dashboard, blocks list, mempool, fees, settings                                    | work; the dashboard uses block spends, not additions                                                                                                                                       |
| Block page                                                                         | loads; its coin lists wait on `get_additions_and_removals` and stay empty until the node is in sync                                                                                        |
| Coinset-only features                                                              | hidden or empty, as documented below                                                                                                                                                       |

What changed after this test (TASK-109):

- **Syncing notice.** While the node reports `synced: false` every page shows a banner with its
  height and the sync target, the connection pill turns amber and reads _Syncing_, and _Test
  connection_ reports the sync progress. An empty mempool from a syncing node says nothing about
  the network, and the notice says so.
- **Settings showed Coinset after a reload.** The endpoint field kept the value of the first
  render (the Coinset default, before the stored settings were read), so it showed and _tested_
  Coinset instead of the saved node. It now follows the saved endpoint until you type.
- **Development only:** under `bun run dev` a detail page opened directly (e.g. `/block/<h>`)
  can show _Could not load the block_ with a custom node: the request refused before the stored
  settings are read is not retried there (most likely React Strict Mode, which only runs in
  development; not confirmed). Production builds are not affected (checked with
  `bun run build && bun run start` and by `tests/e2e/custom-node.spec.ts`); click through from
  the dashboard, or reload, when developing.

## Caddy example

```caddyfile
:8556 {
  reverse_proxy https://localhost:8555 {
    transport http {
      tls_client_auth ~/.chia/mainnet/config/ssl/full_node/private_full_node.crt ~/.chia/mainnet/config/ssl/full_node/private_full_node.key
      tls_insecure_skip_verify
    }
  }
  header Access-Control-Allow-Origin *
  header Access-Control-Allow-Headers content-type
  @options method OPTIONS
  respond @options 204
}
```

Run `caddy run`, then enter `http://127.0.0.1:8556` in Settings (the IP address, not `localhost`: see above) and press _Test connection_
(it calls `get_blockchain_state` and reports the peak height and latency). For a remote node
expose the proxy over HTTPS; Sage only whitelists `https`/`wss` hosts, so a plain-HTTP proxy
works in a browser but not inside the Sage app.

## nginx equivalent

```nginx
server {
  listen 8556;
  location / {
    proxy_pass https://127.0.0.1:8555;
    proxy_ssl_certificate     /home/user/.chia/mainnet/config/ssl/full_node/private_full_node.crt;
    proxy_ssl_certificate_key /home/user/.chia/mainnet/config/ssl/full_node/private_full_node.key;
    proxy_ssl_verify off;
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Headers content-type always;
    if ($request_method = OPTIONS) { return 204; }
  }
}
```

## What you get with a custom node

| Feature                                                 | Custom node                                                                     | Coinset default                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| Chain state, blocks, coins, fee estimate                | from your node, polled every 5 s                                                | hosted server cache + server-sent events |
| Mempool                                                 | fetched in the browser with `get_all_mempool_items` (large; a warning is shown) | server summary API                       |
| Live channel                                            | Polling (custom node), shown in the pill, footer and Settings                   | Server events                            |
| Transaction summaries, address history, CAT/NFT history | hidden with a note (Coinset index only)                                         | available                                |

Nothing on the hosted origin is called while a custom node is active. This is checked by an
end-to-end test (`tests/e2e/custom-node.spec.ts`) that runs the dashboard against a mocked
`https://node.example.test:8556` and fails on any request to Coinset or `/api/<network>/…`.
Until 2026-09-16 the first render leaked a burst of calls to Coinset before the stored
settings were read; fetches from that render are now refused and refetched once settings are in.
