# Deployment: Docker image and ONCE

mempoolxch.space ships as one Docker image that [ONCE](https://github.com/basecamp/once) pulls from
GitHub Container Registry and keeps updated, exactly like Pengui. ONCE owns TLS, the reverse
proxy and the container lifecycle.

## Image contract

`deployment/Dockerfile`: bun builder (installs, runs `bun run build:sage` then `bun run build`),
node 22 alpine runner, non-root `nextjs` user, serves plain HTTP on **port 80**, answers
`GET /up` with 200, `HEALTHCHECK` on `/up`. The runner contains the standalone Next.js server,
its static assets, `public/` and the Sage snapshot at `./sage-snapshot` (served by
`src/proxy.ts` from the same origin).

Build args: `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_COMMIT_SHA` (footer), `NEXT_PUBLIC_APP_URL`
(public https origin, used for absolute links such as the docs page's wiki links; defaults to
`https://mempoolxch.space` when unset). Since decision-012 the server has no reads to proxy, so
this is no longer used to whitelist a hosted origin in the Sage manifest — every network call in
`sage-manifest.json` (Coinset, Dexie, MintGarden) already works standalone.

## CI

`.github/workflows/build-app.yml` builds and pushes `ghcr.io/maximedogawa/mempool-xch:<tag>` and
`:latest` on every published GitHub release and on `workflow_dispatch`. Set the repository
variable `NEXT_PUBLIC_APP_URL` to the public origin. CI never touches the server.

## Deploy (once per server)

1. A server with Docker and a DNS A record for the hostname (ONCE needs it to resolve before
   issuing the Let's Encrypt certificate).
2. `curl https://get.once.com | sh`
3. `once deploy ghcr.io/maximedogawa/mempool-xch:latest --host mempoolxch.space`
4. `curl https://mempoolxch.space/up` → `{"status":"up"}`

`once deploy` enables `--auto-update`, so every new `:latest` image is picked up automatically.
`once list` shows deployments; `once update <host> --env KEY=VALUE` changes settings. No API key
or webhook secret is needed or used (decision-009): every browser's Coinset call, including the
WebSocket, is anonymous and direct (decision-012) — the server has no Coinset connection of its
own to configure.

## Local

```bash
docker compose up --build      # http://localhost:8080
docker build -f deployment/Dockerfile -t mempool-xch:local . && docker run --rm -p 8080:80 mempool-xch:local
```
