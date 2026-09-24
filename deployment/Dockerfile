# mempoolxch.space - Docker image for ONCE (https://github.com/basecamp/once).
# Build stage: bun installs and builds the standalone Next.js server plus the Sage snapshot.
# Pinned >=1.4: 1.3.14 segfaults at the end of `next build` (napi threadsafe-function
# use-after-free in next-swc's Turbopack binding, fixed upstream in 1.4.0 - oven-sh/bun#36866).
FROM oven/bun:1.4-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_COMMIT_SHA
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_COMMIT_SHA=$NEXT_PUBLIC_COMMIT_SHA
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# Feature flags (src/shared/config/features.ts); empty keeps the built-in default.
ARG NEXT_PUBLIC_FEATURE_ARCADE_MAINNET
ARG NEXT_PUBLIC_FEATURE_GAMING_TESTNET
ENV NEXT_PUBLIC_FEATURE_ARCADE_MAINNET=$NEXT_PUBLIC_FEATURE_ARCADE_MAINNET
ENV NEXT_PUBLIC_FEATURE_GAMING_TESTNET=$NEXT_PUBLIC_FEATURE_GAMING_TESTNET

# Sage static snapshot first (its own `next build` with output: export into ./out), then the
# standalone server. Both invoke `next build`, so they must run in sequence.
RUN bun run build:sage
RUN bun run build

# Runtime stage: plain node, non-root, port 80 (ONCE terminates TLS and proxies to port 80).
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl libcap && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Sage snapshot, served from the origin root by src/proxy.ts (not part of Next's module graph).
COPY --from=builder --chown=nextjs:nodejs /app/out ./sage-snapshot

USER nextjs

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/up || exit 1

CMD ["node", "server.js"]
