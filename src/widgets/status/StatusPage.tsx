"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DEXIE_ASSETS_URL } from "@/shared/api/tokenList";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { errorMessage } from "@/shared/lib/rpc/errors";
import { lookupGeo } from "@/shared/lib/map/geo";
import { resolveSeeder, SEEDERS } from "@/shared/lib/map/seeders";
import { MINTGARDEN_API } from "@/shared/lib/nft/mintgarden";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Button, Card, CardBody, CardHeader, Tooltip } from "@/shared/ui";

type Health = "ok" | "degraded" | "down";

interface CheckResult {
  health: Health;
  detail: string;
  latencyMs: number;
}

const CHECK_INTERVAL_MS = 60_000;

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = performance.now();
  const value = await fn();
  return { value, ms: Math.round(performance.now() - t0) };
}

function slow(ms: number, threshold = 2_500): Health {
  return ms > threshold ? "degraded" : "ok";
}

const TONE: Record<Health, { label: string; className: string }> = {
  ok: { label: "Operational", className: "bg-primary-soft text-primary" },
  degraded: { label: "Degraded", className: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-warning" },
  down: { label: "Unreachable", className: "bg-danger-soft text-danger" },
};

/**
 * Health of everything this site depends on, measured from this browser right now: the chain
 * data source (Coinset or the configured node), the indexed API, the live stream, Dexie,
 * MintGarden and the network-map sources. There is no server-side monitor: what you see is
 * what your own connection gets, which is also what the pages get.
 */
export function StatusPage() {
  const { client, endpoints, hydrated } = useSettings();
  const live = useLive();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  const checks = useQueries({
    queries: [
      {
        queryKey: ["status", "rpc", endpoints.rpcUrl],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => client.getBlockchainState(signal));
          return { health: value.synced ? slow(ms) : "degraded", detail: `${value.synced ? "synced" : "not synced"} · peak #${formatNumber(value.peak.height)}`, latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "indexed", endpoints.indexedUrl],
        enabled: hydrated && client.hasIndexed,
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => client.getReorgs({ limit: 1 }, signal));
          return { health: slow(ms), detail: value.reorgs[0] ? `last reorg ${formatAge(value.reorgs[0].detectedAtMs)}` : "answering", latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "dexie"],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => fetch(`${DEXIE_ASSETS_URL}?page_size=1&type=cat`, { signal }));
          if (!value.ok) return { health: "down", detail: `HTTP ${value.status}`, latencyMs: ms };
          return { health: slow(ms), detail: "token registry answering", latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "mintgarden"],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => fetch(`${MINTGARDEN_API}/collections?size=1`, { signal }));
          if (!value.ok) return { health: "down", detail: `HTTP ${value.status}`, latencyMs: ms };
          return { health: slow(ms), detail: "NFT API answering", latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "seeders", endpoints.network],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const seeder = SEEDERS[endpoints.network][0]!;
          const { value, ms } = await timed(() => resolveSeeder(seeder, "A", undefined, signal));
          return { health: value.length > 0 ? slow(ms) : "degraded", detail: `${seeder}: ${value.length} nodes`, latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "geojs"],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => lookupGeo(["8.8.8.8"], undefined, signal));
          return { health: value.get("8.8.8.8") ? slow(ms) : "degraded", detail: value.get("8.8.8.8") ? "geolocation answering" : "answered without a location", latencyMs: ms };
        },
      },
      // Until the stored settings are in, the client may still point at the wrong endpoint.
    ].map((q) => ({ enabled: hydrated, ...q, refetchInterval: CHECK_INTERVAL_MS, staleTime: CHECK_INTERVAL_MS, retry: false })),
  });

  const rows: { name: string; what: string; index?: number; live?: CheckResult; hidden?: boolean }[] = [
    { name: endpoints.isCoinset ? "Coinset full-node RPC" : "Your node (full-node RPC)", what: endpoints.rpcUrl.replace(/^https?:\/\//, ""), index: 0 },
    { name: "Coinset indexed API", what: endpoints.indexedUrl?.replace(/^https?:\/\//, "") ?? "not available on a custom node", index: 1, hidden: !client.hasIndexed },
    {
      name: "Live stream",
      what: endpoints.wsUrl ? endpoints.wsUrl.replace(/^wss?:\/\//, "").replace(/\?.*$/, "") : "polling only",
      live: {
        health: live.status === "live" ? "ok" : live.status === "polling" ? "degraded" : live.status === "connecting" ? "degraded" : "down",
        detail: `${live.status}${live.transport === "websocket" ? " over websocket" : " via polling"}${live.lastEventAt ? ` · last event ${formatAge(live.lastEventAt, now)}` : ""}${live.peakHeight ? ` · peak #${formatNumber(live.peakHeight)}` : ""}`,
        latencyMs: 0,
      },
    },
    { name: "Dexie", what: "api.dexie.space", index: 2 },
    { name: "MintGarden", what: "api.mintgarden.io", index: 3 },
    { name: "Chia DNS introducers", what: "via cloudflare-dns.com", index: 4 },
    { name: "GeoJS", what: "get.geojs.io", index: 5 },
  ];
  const visible = rows.filter((r) => !r.hidden);
  const resolved = visible.map((r) => (r.live ? r.live : r.index !== undefined ? (checks[r.index]?.error ? ({ health: "down", detail: errorMessage(checks[r.index]!.error), latencyMs: 0 } as CheckResult) : checks[r.index]?.data) : undefined));
  const worst: Health = resolved.some((r) => r?.health === "down") ? "down" : resolved.some((r) => r?.health === "degraded") ? "degraded" : "ok";
  const checkedAt = Math.max(0, ...checks.map((c) => c.dataUpdatedAt));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Status</h1>
          <Tooltip text="Measured from your browser right now, the same way the pages fetch their data. There is no server-side monitor and no history; a red row means your connection cannot reach that service at the moment." placement="bottom" />
        </div>
      </header>

      <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-card border border-border px-4 py-3", worst === "ok" ? "bg-primary-soft/40" : worst === "degraded" ? "bg-[color-mix(in_srgb,var(--warning)_8%,transparent)]" : "bg-danger-soft/40")}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden="true" className={cn("inline-block h-2.5 w-2.5 rounded-full", worst === "ok" ? "bg-primary" : worst === "degraded" ? "bg-warning" : "bg-danger")} />
          <span data-testid="status-overall">{worst === "ok" ? "All services reachable" : worst === "degraded" ? "Some services are slow or degraded" : "Some services are unreachable"}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-fg-faint">
          {checkedAt > 0 ? <span>checked {formatAge(checkedAt, now)} · re-checks every minute</span> : <span>checking…</span>}
          <Button variant="secondary" size="sm" onClick={() => checks.forEach((c) => void c.refetch())}>
            Check again
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Services" />
        <CardBody>
          <ul className="flex flex-col divide-y divide-border/60" aria-label="Service status">
            {visible.map((row, i) => {
              const result = resolved[i];
              const pending = !result && !row.live;
              const tone = result ? TONE[result.health] : null;
              return (
                <li key={row.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium text-fg">{row.name}</span>
                    <span className="mono truncate text-xs text-fg-faint">{row.what}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="hidden text-fg-muted sm:inline">{result?.detail ?? (pending ? "checking…" : "")}</span>
                    {result && result.latencyMs > 0 ? <span className="tabular text-fg-faint">{formatNumber(result.latencyMs)} ms</span> : null}
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", tone ? tone.className : "bg-surface-2 text-fg-muted")} data-testid={`status-${row.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                      {tone ? tone.label : "Checking"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <p className="text-xs text-fg-faint">
        The site itself is a static app served from mempoolxch.space (health endpoint <span className="mono">/up</span>); everything else is fetched by your
        browser from the services above. Coinset publishes its own status independently of this page.
      </p>
    </div>
  );
}
