# Deployment

mempoolxch.space ships as a single Docker image that [ONCE](https://github.com/basecamp/once) pulls
from GitHub Container Registry and keeps updated. ONCE owns TLS, the reverse proxy and the
container lifecycle, so there is no nginx or deploy script to maintain here.

| What          | Image                                     | Hostname (example) |
| ------------- | ----------------------------------------- | ------------------ |
| App (Next.js) | `ghcr.io/maximedogawa/mempool-xch:latest` | `mempoolxch.space` |

## The contract

The image serves plain HTTP on **port 80** and answers `GET /up` with `200` (`src/app/up/route.ts`).
That is all ONCE requires. It runs as the non-root `nextjs` user; `libcap` grants node the
right to bind port 80.

## Prerequisites (once per server)

- A server reachable from the Internet with Docker installed.
- A DNS **A record** for the hostname pointing at the server. ONCE needs it to resolve before it
  can issue the Let's Encrypt certificate.
- ONCE installed: `curl https://get.once.com | sh`

## Deploy

```bash
once deploy ghcr.io/maximedogawa/mempool-xch:latest --host mempoolxch.space
curl https://mempoolxch.space/up
```

Run once, by hand, on the server. `once deploy` enables `--auto-update`, so every image CI
pushes to `:latest` is picked up automatically. `once list` shows what is deployed and
`once update <host> --env KEY=VALUE` changes settings.

## Building the image

CI (`.github/workflows/build-app.yml`) builds and pushes the image on every published GitHub
release and on `workflow_dispatch`. Build args:

| Arg                                  | Purpose                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_VERSION`            | Shown in the footer                                                              |
| `NEXT_PUBLIC_COMMIT_SHA`             | Shown in the footer                                                              |
| `NEXT_PUBLIC_APP_URL`                | Public origin, used for the Sage install URL and the summary API in the snapshot |
| `NEXT_PUBLIC_FEATURE_GAMING_TESTNET` | `0` hides the nokitlan testnet gaming on `/gaming`; unset = on everywhere        |

## Runtime settings

Set on the running container, never at build time: `once update <host> --env KEY=VALUE` (or the
environment settings in the ONCE UI). The server reads them on each request, so one image
serves any deployment and a changed value needs no rebuild.

| Variable                    | Purpose                                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL_MAINNET`           | The main API a mainnet visitor's reads start on: a nodexch gateway or Coinset (`https://…`). Empty: `https://api.nodexch.space` when `NODEXCH_KEY_MAINNET` is set, else Coinset.                                        |
| `API_FALLBACK_URL_MAINNET`  | Where reads go while the main API fails (e.g. `https://api.coinset.org`), called without a key; the app returns to the main API once it answers. Dexie's paths fall back to Dexie too. Empty: no automatic fallback.    |
| `NODEXCH_KEY_MAINNET`       | The site's publishable nodexch key (`nxp_…`, bound to the site's origin). The server hands it to the browser through `/runtime-config.js`. Without it the site starts on Coinset: the gateway refuses keyless requests. |
| `NODEXCH_KEY_TESTNET11`     | The same for testnet11; unused while no hosted gateway runs there.                                                                                                                                                      |
| `MEMPOOL_RPC_URL_<NETWORK>` | Transaction badge (`/api/badge/tx/<id>`): a Coinset-dialect endpoint the server asks; empty means Coinset.                                                                                                              |
| `MEMPOOL_RPC_KEY_<NETWORK>` | Its key, sent by the server only.                                                                                                                                                                                       |

A visitor who picked another endpoint in Settings keeps it; the fallback only covers the main
API. A gateway on another host than `api.nodexch.space` is used without a key unless one is set,
and its token icons only load once its host is added to `TRUSTED_IMAGE_HOSTS`
(`src/shared/lib/trustedImage.ts`, which also builds the CSP).

Only a publishable key (`nxp_…`) belongs in `NODEXCH_KEY_*`: it reaches every visitor's browser,
and the server drops anything else. The Sage snapshot is a static export without a server, so it
never carries the site's key and starts on Coinset.

Locally:

```bash
docker compose up --build        # http://localhost:8080
# or
docker build -f deployment/Dockerfile -t mempool-xch:local .
docker run --rm -p 8080:80 mempool-xch:local
```

## What the container serves

- `/` and the explorer pages: the standalone Next.js server (`output: "standalone"`).
- `/api/<network>/mempool`: the compact mempool summary API (in-memory, refreshed every 3 s,
  Coinset hosts only). Sends `Access-Control-Allow-Origin: *` so the Sage snapshot can call it.
- `/sage-manifest.json` and every file it lists: the Sage wallet snapshot (`bun run build:sage`
  → `out/`), served from the origin root by `src/proxy.ts`. The install URL for Sage → Apps →
  Install from URL is the origin itself.
