"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { DEXIE_ASSETS_URL } from "@/shared/api/tokenList";
import { useT } from "@/shared/i18n/useT";
import type { MessageValues } from "@/shared/i18n/translate";
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
import statusNs from "@/shared/i18n/messages/en/status";

type Health = "ok" | "degraded" | "down";

type DetailKey =
  | "detail.synced"
  | "detail.notSynced"
  | "detail.lastReorg"
  | "detail.answering"
  | "detail.dexie"
  | "detail.mintgarden"
  | "detail.seeder"
  | "detail.geo"
  | "detail.geoNoLocation";

/**
 * A message key (translated at render, so a language switch updates it) or raw text. `ageMs` is
 * a timestamp passed to the message as `{age}`, formatted at render for the same reason.
 */
type Detail = { key: DetailKey; values?: MessageValues; ageMs?: number } | { text: string };

interface CheckResult {
  health: Health;
  detail: Detail;
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

const TONE: Record<Health, string> = {
  ok: "bg-primary-soft text-primary",
  degraded: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-warning",
  down: "bg-danger-soft text-danger",
};

/**
 * Health of everything this site depends on, measured from this browser right now: the chain
 * data source (Coinset or the configured node), the indexed API, the live stream, Dexie,
 * MintGarden and the network-map sources. There is no server-side monitor: what you see is
 * what your own connection gets, which is also what the pages get.
 */
export function StatusPage() {
  const t = useT(statusNs);
  const { client, endpoints, hydrated } = useSettings();
  const live = useLive();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  const checks = useQueries({
    queries: [
      {
        queryKey: ["status", "rpc", endpoints.rpcUrl],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => client.getBlockchainState(signal));
          return {
            health: value.synced ? slow(ms) : "degraded",
            detail: {
              key: value.synced ? "detail.synced" : "detail.notSynced",
              values: { height: formatNumber(value.peak.height) },
            },
            latencyMs: ms,
          };
        },
      },
      {
        queryKey: ["status", "indexed", endpoints.indexedUrl],
        enabled: hydrated && client.hasIndexed,
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => client.getReorgs({ limit: 1 }, signal));
          return {
            health: slow(ms),
            detail: value.reorgs[0]
              ? {
                  key: "detail.lastReorg",
                  ageMs: value.reorgs[0].detectedAtMs,
                }
              : { key: "detail.answering" },
            latencyMs: ms,
          };
        },
      },
      {
        queryKey: ["status", "dexie"],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() =>
            fetch(`${DEXIE_ASSETS_URL}?page_size=1&type=cat`, { signal })
          );
          if (!value.ok)
            return { health: "down", detail: { text: `HTTP ${value.status}` }, latencyMs: ms };
          return { health: slow(ms), detail: { key: "detail.dexie" }, latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "mintgarden"],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() =>
            fetch(`${MINTGARDEN_API}/collections?size=1`, { signal })
          );
          if (!value.ok)
            return { health: "down", detail: { text: `HTTP ${value.status}` }, latencyMs: ms };
          return { health: slow(ms), detail: { key: "detail.mintgarden" }, latencyMs: ms };
        },
      },
      {
        queryKey: ["status", "seeders", endpoints.network],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const seeder = SEEDERS[endpoints.network][0]!;
          const { value, ms } = await timed(() => resolveSeeder(seeder, "A", undefined, signal));
          return {
            health: value.length > 0 ? slow(ms) : "degraded",
            detail: { key: "detail.seeder", values: { seeder, count: value.length } },
            latencyMs: ms,
          };
        },
      },
      {
        queryKey: ["status", "geojs"],
        queryFn: async ({ signal }: { signal: AbortSignal }): Promise<CheckResult> => {
          const { value, ms } = await timed(() => lookupGeo(["8.8.8.8"], undefined, signal));
          return {
            health: value.get("8.8.8.8") ? slow(ms) : "degraded",
            detail: {
              key: value.get("8.8.8.8") ? "detail.geo" : "detail.geoNoLocation",
            },
            latencyMs: ms,
          };
        },
      },
      // Until the stored settings are in, the client may still point at the wrong endpoint.
    ].map((q) => ({
      enabled: hydrated,
      ...q,
      refetchInterval: CHECK_INTERVAL_MS,
      staleTime: CHECK_INTERVAL_MS,
      retry: false,
    })),
  });

  const rows: {
    /** Stable, language-independent id (the English name as a slug) for the test id. */
    id: string;
    name: string;
    what: string;
    index?: number;
    live?: CheckResult;
    hidden?: boolean;
  }[] = [
    {
      id: endpoints.isCoinset ? "coinset-full-node-rpc" : "your-node-full-node-rpc-",
      name: endpoints.isCoinset ? t("names.coinsetRpc") : t("names.ownNode"),
      what: endpoints.rpcUrl.replace(/^https?:\/\//, ""),
      index: 0,
    },
    {
      id: "coinset-indexed-api",
      name: t("names.indexed"),
      what: endpoints.indexedUrl?.replace(/^https?:\/\//, "") ?? t("what.noIndexed"),
      index: 1,
      hidden: !client.hasIndexed,
    },
    {
      id: "live-stream",
      name: t("names.live"),
      what: endpoints.wsUrl
        ? endpoints.wsUrl.replace(/^wss?:\/\//, "").replace(/\?.*$/, "")
        : t("what.pollingOnly"),
      live: {
        health:
          live.status === "live"
            ? "ok"
            : live.status === "polling"
              ? "degraded"
              : live.status === "connecting"
                ? "degraded"
                : "down",
        detail: {
          text: `${t(live.transport === "websocket" ? "live.websocket" : "live.viaPolling", {
            state: t(`live.state.${live.status}`),
          })}${live.lastEventAt ? t("live.lastEvent", { age: formatAge(live.lastEventAt, now) }) : ""}${live.peakHeight ? t("live.peak", { height: formatNumber(live.peakHeight) }) : ""}`,
        },
        latencyMs: 0,
      },
    },
    { id: "dexie", name: "Dexie", what: "api.dexie.space", index: 2 },
    { id: "mintgarden", name: "MintGarden", what: "api.mintgarden.io", index: 3 },
    { id: "chia-dns-introducers", name: t("names.dns"), what: t("what.viaDns"), index: 4 },
    { id: "geojs", name: "GeoJS", what: "get.geojs.io", index: 5 },
  ];
  const visible = rows.filter((r) => !r.hidden);
  const resolved = visible.map((r) =>
    r.live
      ? r.live
      : r.index !== undefined
        ? checks[r.index]?.error
          ? ({
              health: "down",
              detail: { text: errorMessage(checks[r.index]!.error) },
              latencyMs: 0,
            } as CheckResult)
          : checks[r.index]?.data
        : undefined
  );
  const worst: Health = resolved.some((r) => r?.health === "down")
    ? "down"
    : resolved.some((r) => r?.health === "degraded")
      ? "degraded"
      : "ok";
  const checkedAt = Math.max(0, ...checks.map((c) => c.dataUpdatedAt));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <Tooltip text={t("tooltip")} placement="bottom" />
        </div>
      </header>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-card border border-border px-4 py-3",
          worst === "ok"
            ? "bg-primary-soft/40"
            : worst === "degraded"
              ? "bg-[color-mix(in_srgb,var(--warning)_8%,transparent)]"
              : "bg-danger-soft/40"
        )}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full",
              worst === "ok" ? "bg-primary" : worst === "degraded" ? "bg-warning" : "bg-danger"
            )}
          />
          <span data-testid="status-overall">{t(`overall.${worst}`)}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-fg-faint">
          {checkedAt > 0 ? (
            <span>{t("checked", { age: formatAge(checkedAt, now) })}</span>
          ) : (
            <span>{t("checking")}</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => checks.forEach((c) => void c.refetch())}
          >
            {t("checkAgain")}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title={t("services")} />
        <CardBody>
          <ul className="flex flex-col divide-y divide-border/60" aria-label={t("serviceList")}>
            {visible.map((row, i) => {
              const result = resolved[i];
              const pending = !result && !row.live;
              const detail = result
                ? "text" in result.detail
                  ? result.detail.text
                  : t(result.detail.key, {
                      ...result.detail.values,
                      ...(result.detail.ageMs === undefined
                        ? {}
                        : { age: formatAge(result.detail.ageMs) }),
                    })
                : null;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium text-fg">{row.name}</span>
                    <span className="mono truncate text-xs text-fg-faint">{row.what}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="hidden text-fg-muted sm:inline">
                      {detail ?? (pending ? t("checking") : "")}
                    </span>
                    {result && result.latencyMs > 0 ? (
                      <span className="tabular text-fg-faint">
                        {t("latency", { ms: formatNumber(result.latencyMs) })}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        result ? TONE[result.health] : "bg-surface-2 text-fg-muted"
                      )}
                      data-testid={`status-${row.id}`}
                    >
                      {t(result ? `health.${result.health}` : "health.checking")}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <p className="text-xs text-fg-faint">
        {t.rich("footnote", { code: (c) => <span className="mono">{c}</span> })}
      </p>
    </div>
  );
}
