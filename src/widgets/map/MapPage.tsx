"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { intlTag } from "@/shared/i18n/active";
import { formatFixed } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { regionColor } from "@/shared/lib/map/colors";
import {
  parseSnapshot,
  SNAPSHOT_MAX_AGE_MS,
  snapshotState,
  type SnapshotState,
} from "@/shared/lib/map/dashboard";
import dashboardSnapshot from "@/shared/lib/map/dashboardSnapshot.json";
import { lookupGeo, type NodeGeo } from "@/shared/lib/map/geo";
import { isPublicIp } from "@/shared/lib/map/seeders";
import {
  concentration,
  countryRows,
  regionRows,
  scanRows,
  transportRows,
  versionBreakdown,
  type CountryRow,
} from "@/shared/lib/map/stats";
import { routes } from "@/shared/lib/routes";
import type { PeerConnection } from "@/shared/lib/rpc/types";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { MapHistory } from "./MapHistory";
import { useAnimationPause, useEntrances } from "./useMapAnimation";
import { useMapNames } from "./useMapNames";
import { SCAN_INTERVAL_MS, useNodeScan, type NodeScanState } from "./useNodeScan";
import { WorldMap, type MapHandle, type MapPulse, type PeerMarker } from "./WorldMap";

const CONNECTION_TYPE = {
  0: "fullNode",
  1: "harvester",
  2: "farmer",
  3: "timelord",
  4: "introducer",
  5: "wallet",
} as const satisfies Record<number, string>;

function isKnownType(type: number): type is keyof typeof CONNECTION_TYPE {
  return type in CONNECTION_TYPE;
}
const COUNTRY_ROWS = 15;
const FEED_LIMIT = 10;
const PULSE_MS = 1_600;
/** The shipped snapshot, checked once; null (missing or malformed) sends the page to the scan. */
const SNAPSHOT = parseSnapshot(dashboardSnapshot);
const DAY_MS = 24 * 60 * 60 * 1000;
const DASHBOARD_URL = "https://dashboard.chia.net/d/em15uQ47k/peer-info";

const formatDay = (t: number) =>
  new Date(t).toLocaleDateString(intlTag(), { day: "2-digit", month: "short", year: "numeric" });

/**
 * The time the page judges the snapshot's age by: null while prerendering (the build must not
 * bake its own clock into the page), the moment the page's code loaded once in the browser.
 */
const noSubscription = () => () => {};
const loadedAt = typeof window === "undefined" ? 0 : Date.now();
function usePageClock(): number | null {
  return useSyncExternalStore(
    noSubscription,
    () => loadedAt,
    () => null
  );
}

function byteRate(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${formatFixed(bytes / 1024, 1)} KB`;
  return `${formatFixed(bytes / (1024 * 1024), 1)} MB`;
}

interface FeedEntry {
  id: number;
  t: number;
  kind: "block" | "bundles";
  height?: number;
  ids?: string[];
  status?: "pending" | "confirmed" | "removed";
}

/** Random country, weighted by how many nodes it holds, for the modelled propagation pulses. */
function pickCountry(rows: readonly CountryRow[], total: number): CountryRow | null {
  if (rows.length === 0 || total === 0) return null;
  let r = Math.random() * total;
  for (const row of rows) {
    r -= row.nodes;
    if (r <= 0) return row;
  }
  return rows[rows.length - 1] ?? null;
}

/**
 * Live activity from the tab's own Coinset stream: new peaks and mempool batches, plus pulses
 * on the map. The pulses are a model (random reported countries weighted by population), not
 * where anything really came from: Chia does not reveal the origin of a block or a spend bundle.
 */
function useActivity(rows: CountryRow[], paused: boolean) {
  const peakHeight = useLiveValue("peakHeight");
  const txBatch = useLiveValue("txBatch");
  const lastTxEvent = useLiveValue("lastTxEvent");
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [pulses, setPulses] = useState<MapPulse[]>([]);
  const [counts, setCounts] = useState({ blocks: 0, bundles: 0 });
  const seq = useRef(0);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const lastPeak = useRef<number | null>(null);
  const lastBatch = useRef(0);
  const pulseTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = pulseTimers.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const pulse = (kind: MapPulse["kind"], n: number) => {
    // No pulses nobody can see: hidden tab, map scrolled away, or reduced motion.
    if (pausedRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const list = rowsRef.current.filter((row) => row.lat !== null);
    const total = list.reduce((sum, row) => sum + row.nodes, 0);
    const fresh: MapPulse[] = [];
    for (let i = 0; i < n; i += 1) {
      const row = pickCountry(list, total);
      if (row) fresh.push({ id: (seq.current += 1), countryKey: row.key, kind });
    }
    if (fresh.length === 0) return;
    setPulses((p) => [...p, ...fresh].slice(-48));
    const ids = new Set(fresh.map((f) => f.id));
    const timer = setTimeout(() => {
      pulseTimers.current.delete(timer);
      setPulses((p) => p.filter((x) => !ids.has(x.id)));
    }, PULSE_MS);
    pulseTimers.current.add(timer);
  };

  useEffect(() => {
    if (peakHeight === null) return;
    if (lastPeak.current === null) {
      lastPeak.current = peakHeight;
      return;
    }
    if (peakHeight <= lastPeak.current) return;
    lastPeak.current = peakHeight;
    setFeed((f) =>
      [
        { id: (seq.current += 1), t: Date.now(), kind: "block" as const, height: peakHeight },
        ...f,
      ].slice(0, FEED_LIMIT)
    );
    setCounts((c) => ({ ...c, blocks: c.blocks + 1 }));
    pulse("block", 6);
  }, [peakHeight]);

  useEffect(() => {
    if (txBatch === lastBatch.current || !lastTxEvent) return;
    lastBatch.current = txBatch;
    if (lastTxEvent.status !== "pending" || lastTxEvent.ids.length === 0) return;
    setFeed((f) =>
      [
        {
          id: (seq.current += 1),
          t: Date.now(),
          kind: "bundles" as const,
          ids: lastTxEvent.ids.slice(0, 3),
          status: lastTxEvent.status,
        },
        ...f,
      ].slice(0, FEED_LIMIT)
    );
    setCounts((c) => ({ ...c, bundles: c.bundles + lastTxEvent.ids.length }));
    pulse("bundle", Math.min(3, lastTxEvent.ids.length));
  }, [txBatch, lastTxEvent]);

  return { feed, pulses, counts };
}

export function MapPage() {
  const t = useT("map");
  const names = useMapNames();
  const { client, endpoints } = useSettings();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  /** The suggestion list opens while typing and closes once a country is picked. */
  const [suggest, setSuggest] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [showArcs, setShowArcs] = useState(true);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [scale, setScale] = useState(1);
  const map = useRef<MapHandle | null>(null);

  const clock = usePageClock();
  const source: SnapshotState = useMemo(
    () =>
      snapshotState(
        SNAPSHOT,
        endpoints.network,
        // Before the browser clock is known, judge the snapshot as of its own capture.
        clock ?? (SNAPSHOT ? Date.parse(SNAPSHOT.observedAt) : 0)
      ),
    [endpoints.network, clock]
  );
  /** The dashboard snapshot while it is the page's source; null in the seeder-scan fallback. */
  const dash = source.mode === "snapshot" ? source.snapshot : null;
  const scan = useNodeScan(endpoints.network, source.mode === "scan");
  const rows = useMemo(
    () => (dash ? countryRows(dash) : scanRows(scan.registry)),
    [dash, scan.registry]
  );
  const regions = useMemo(() => regionRows(rows), [rows]);
  const versions = useMemo(() => (dash ? versionBreakdown(dash) : null), [dash]);
  const transport = useMemo(() => (dash ? transportRows(dash) : []), [dash]);
  const spread = useMemo(() => concentration(rows), [rows]);
  /** Nodes the country panel accounts for; the total-nodes panel is a separate query. */
  const placed = useMemo(() => rows.reduce((sum, row) => sum + row.nodes, 0), [rows]);
  /** The population the shares are of: the dashboard's total, or the nodes the scan located. */
  const population = dash ? dash.total : placed;
  const unaccounted = dash ? dash.total - placed : 0;

  const stage = useRef<HTMLDivElement | null>(null);
  const paused = useAnimationPause(stage);
  const activity = useActivity(rows, paused);
  const entering = useEntrances(
    rows,
    dash ? dash.observedAt : "scan",
    dash ? `mempool-xch:map:seen:v1:${endpoints.network}` : null,
    paused
  );

  // ---- search and region filters -----------------------------------------
  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed.length > 0 || regionFilter !== null;
  const matchedRows = useMemo(
    () =>
      rows.filter((row) => {
        if (regionFilter && row.region !== regionFilter) return false;
        if (!trimmed) return true;
        return (
          row.label.toLowerCase().includes(trimmed) ||
          names.country(row).toLowerCase().includes(trimmed) ||
          row.code.toLowerCase() === trimmed ||
          String(row.region).toLowerCase().includes(trimmed) ||
          names.region(row.region).toLowerCase().includes(trimmed)
        );
      }),
    [rows, trimmed, regionFilter, names]
  );
  const matched = useMemo(() => new Set(matchedRows.map((row) => row.key)), [matchedRows]);
  const matchedNodes = matchedRows.reduce((sum, row) => sum + row.nodes, 0);

  // Refit the view whenever the matched set changes, so a search frames its own results.
  const fitKey = filtered ? matchedRows.map((row) => row.key).join("|") : "";
  useEffect(() => {
    if (!map.current) return;
    if (!fitKey) {
      map.current.reset();
      return;
    }
    const points = fitKey
      .split("|")
      .map((key) => rows.find((row) => row.key === key))
      .filter((row): row is CountryRow => !!row && row.lat !== null)
      .map((row) => ({ lat: row.lat!, lon: row.lon! }));
    map.current.fit(points);
  }, [fitKey, rows]);

  const selectedRow = selected ? (rows.find((row) => row.key === selected) ?? null) : null;
  const hoveredRow = hovered ? (rows.find((row) => row.key === hovered) ?? null) : null;
  const detail = hoveredRow ?? selectedRow;

  const selectCountry = useCallback(
    (key: string | null) => {
      setSelected(key);
      const row = key ? rows.find((item) => item.key === key) : null;
      if (row && row.lat !== null && row.lon !== null) {
        map.current?.fit([{ lat: row.lat, lon: row.lon }]);
      }
    },
    [rows]
  );

  // ---- a configured node's own peers --------------------------------------
  const connections = useQuery({
    queryKey: [...queryKeys.chainRoot(endpoints.network), "connections"],
    queryFn: ({ signal }) => client.getConnections(signal),
    enabled: !endpoints.isCoinset,
    refetchInterval: 15_000,
  });
  const peerHosts = useMemo(
    () =>
      [
        ...new Set(
          (connections.data ?? []).map((p) => p.peerHost.toLowerCase()).filter(isPublicIp)
        ),
      ].sort(),
    [connections.data]
  );
  const peerGeo = useQuery({
    queryKey: ["peerGeo", peerHosts],
    queryFn: ({ signal }) => lookupGeo(peerHosts, undefined, signal),
    enabled: peerHosts.length > 0,
    staleTime: Infinity,
  });
  const peerMarkers: PeerMarker[] = useMemo(
    () =>
      peerHosts.flatMap((host) => {
        const geo = peerGeo.data?.get(host);
        return geo
          ? [
              {
                host,
                lat: geo.lat,
                lon: geo.lon,
                label: geo.city ? `${geo.city}, ${geo.country}` : geo.country,
                org: geo.org,
              },
            ]
          : [];
      }),
    [peerHosts, peerGeo.data]
  );
  /** How many of this node's peers sit in each reported country, for the detail panel. */
  const peersByCountry = useMemo(() => {
    const acc = new Map<string, number>();
    for (const host of peerHosts) {
      const geo = peerGeo.data?.get(host);
      if (geo) acc.set(geo.country, (acc.get(geo.country) ?? 0) + 1);
    }
    return acc;
  }, [peerHosts, peerGeo.data]);

  const snapshotAge = dash ? formatAge(Date.parse(dash.observedAt), clock ?? undefined) : "—";
  const visibleCountries = showAllCountries ? matchedRows : matchedRows.slice(0, COUNTRY_ROWS);

  const bold = (c: ReactNode) => <strong className="text-fg">{c}</strong>;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <Tooltip text={t("titleHint")} placement="bottom" />
        </div>
        <p className="max-w-3xl text-sm text-fg-muted">{t("intro")} </p>
      </header>

      {dash ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile
            label={t("stats.fullNodes")}
            value={formatNumber(dash.total)}
            sub={t("stats.fullNodesSub")}
            tone="primary"
            hint={t("stats.fullNodesHint")}
          />
          <StatTile
            label={t("stats.reliable")}
            value={dash.capacity !== null ? formatNumber(dash.capacity) : "—"}
            sub={
              dash.capacity !== null
                ? t("stats.reliableSub", { share: formatPercent(dash.capacity / dash.total, 1) })
                : undefined
            }
            hint={t("stats.reliableHint")}
          />
          <StatTile
            label={t("stats.ipv6")}
            value={dash.ipv6 !== null ? formatPercent(dash.ipv6 / dash.total, 1) : "—"}
            sub={dash.ipv6 !== null ? t("stats.ipv6Sub", { count: dash.ipv6 }) : undefined}
            hint={t("stats.ipv6Hint")}
          />
          <StatTile
            label={t("stats.countries")}
            value={formatNumber(rows.length)}
            sub={t("stats.countriesSub", { count: placed })}
            hint={t("stats.countriesHint")}
          />
          <ConcentrationTile spread={spread} top={rows[0] ?? null} />
          <StatTile
            label={t("stats.snapshot")}
            value={snapshotAge}
            sub={t("stats.snapshotSub")}
            hint={t("stats.snapshotHint")}
          />
        </div>
      ) : (
        <ScanTiles scan={scan} rows={rows} spread={spread} />
      )}

      {source.mode === "scan" ? (
        <p
          role="note"
          className="rounded-sm border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-fg-muted"
        >
          {source.reason === "stale" && source.snapshot
            ? t("fallback.stale", {
                date: formatDay(Date.parse(source.snapshot.observedAt)),
                days: Math.round(SNAPSHOT_MAX_AGE_MS / DAY_MS),
              })
            : source.reason === "network"
              ? t("fallback.network", { network: endpoints.network })
              : t("fallback.missing")}{" "}
          {t("fallback.scan")}
        </p>
      ) : null}

      <Card>
        <CardHeader
          title={t("mapCard.title")}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={showArcs}
                className={`map-toggle ${showArcs ? "map-toggle-active" : ""}`}
                onClick={() => setShowArcs((on) => !on)}
              >
                {t("mapCard.modelledReach")}
              </button>
              <div className="flex overflow-hidden rounded-sm border border-border bg-bg-elevated">
                <button
                  type="button"
                  aria-label={t("mapCard.zoomIn")}
                  className="map-control"
                  onClick={() => map.current?.zoomBy(1.4)}
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label={t("mapCard.zoomOut")}
                  className="map-control"
                  onClick={() => map.current?.zoomBy(1 / 1.4)}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label={t("mapCard.resetView")}
                  className="map-control map-control-wide"
                  onClick={() => {
                    setQuery("");
                    setSuggest(false);
                    setRegionFilter(null);
                    setSelected(null);
                    map.current?.reset();
                  }}
                >
                  {t("mapCard.reset")}
                </button>
              </div>
            </div>
          }
        />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="map-location-search" className="sr-only">
                {t("mapCard.searchLabel")}
              </label>
              <input
                id="map-location-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSuggest(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSuggest(false);
                }}
                placeholder={t("mapCard.searchPlaceholder")}
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-primary"
              />
              {suggest && trimmed && matchedRows.length > 0 ? (
                <div className="absolute z-20 mt-1 flex w-full flex-col rounded-sm border border-border bg-bg-elevated p-1 shadow-card">
                  {matchedRows.slice(0, 6).map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => {
                        setQuery(names.country(row));
                        setSuggest(false);
                        selectCountry(row.key);
                      }}
                      className="flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-surface-2"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ background: regionColor(row.region) }}
                          aria-hidden="true"
                        />
                        <span className="text-accent">{names.country(row)}</span>
                        <span className="text-fg-faint">#{row.rank}</span>
                      </span>
                      <span className="tabular text-fg-faint">
                        {t("mapCard.suggestionNodes", { count: row.nodes })}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {regions.map((region) => {
                const active = regionFilter === region.region;
                return (
                  <button
                    key={region.region}
                    type="button"
                    aria-pressed={active}
                    style={{ color: active ? regionColor(region.region) : undefined }}
                    className={`map-legend-chip ${active ? "map-legend-chip-active" : ""}`}
                    onClick={() => {
                      setRegionFilter(active ? null : String(region.region));
                      setSelected(null);
                    }}
                  >
                    <span
                      className="inline-block size-2 rounded-full"
                      style={{ background: regionColor(region.region) }}
                      aria-hidden="true"
                    />
                    {names.region(region.region)}
                    <span className="tabular text-fg-faint">{formatNumber(region.nodes)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-faint">
            <span>
              {filtered
                ? t("mapCard.filteredSummary", {
                    shown: matchedRows.length,
                    total: rows.length,
                    nodes: matchedNodes,
                    share: formatPercent(population > 0 ? matchedNodes / population : 0, 1),
                  })
                : t("mapCard.summary", { nodes: population, countries: rows.length })}
            </span>
            <span className="tabular">
              {t("mapCard.controls", { scale: formatFixed(scale, 1) })}
            </span>
          </div>

          <div className="relative" ref={stage}>
            <WorldMap
              handleRef={map}
              countries={rows}
              peers={peerMarkers}
              pulses={activity.pulses}
              hovered={hovered}
              onHover={setHovered}
              selected={selected}
              onSelect={selectCountry}
              matched={matched}
              filtered={filtered}
              showArcs={showArcs}
              entering={entering}
              paused={paused}
              onViewChange={setScale}
            />
            <CountryDetail
              row={detail}
              peers={detail ? (peersByCountry.get(detail.label) ?? 0) : 0}
              scan={!dash}
            />
            {filtered && matchedRows.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-sm border border-border bg-bg-elevated/95 px-3 py-2 text-xs text-fg-muted shadow-card">
                  {t("mapCard.noMatch", { query })}
                </span>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-fg-faint">{t("mapCard.modelLegend")}</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t("activity.title")}
            action={
              <span className="tabular text-xs text-fg-faint">
                {t("activity.counts", {
                  blocks: activity.counts.blocks,
                  bundles: activity.counts.bundles,
                })}
              </span>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {activity.feed.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-faint">{t("activity.waiting")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60 text-sm" aria-live="polite">
                {activity.feed.map((e) => (
                  <li
                    key={e.id}
                    className="animate-row-in flex flex-wrap items-center justify-between gap-2 py-1.5 pl-2"
                  >
                    {e.kind === "block" ? (
                      <span>
                        {t.rich("activity.newPeak", {
                          height: formatNumber(e.height!),
                          link: (c) => (
                            <Link
                              href={routes.block(e.height!)}
                              className="text-accent hover:underline"
                            >
                              {c}
                            </Link>
                          ),
                        })}
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1.5">
                        {e.ids!.map((id) => (
                          <Link
                            key={id}
                            href={routes.tx(id)}
                            className="mono text-xs text-accent hover:underline"
                          >
                            {shortId(id, 6, 4)}
                          </Link>
                        ))}
                      </span>
                    )}
                    <span className="text-xs text-fg-faint">{formatAge(e.t)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {versions ? (
          <Card>
            <CardHeader
              title={t("versions.title")}
              action={
                <span className="tabular text-xs text-fg-faint">
                  {t("versions.reporting", { count: versions.reporting })}
                </span>
              }
            />
            <CardBody className="flex flex-col gap-3">
              {versions.rows.length === 0 ? (
                <p className="py-6 text-center text-sm text-fg-faint">{t("versions.empty")}</p>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    {versions.rows.map((version) => (
                      <li key={version.label} className="flex items-center gap-3 text-sm">
                        <span className="mono w-16 shrink-0 text-fg">{version.label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                          <div
                            className="h-full rounded-full transition-[width] duration-500"
                            style={{
                              width: `${Math.max(1, version.share * 100)}%`,
                              background: version.newest ? "var(--primary)" : "var(--info)",
                            }}
                          />
                        </div>
                        <span className="tabular w-14 shrink-0 text-right text-xs text-fg-muted">
                          {formatPercent(version.share, 1)}
                        </span>
                        <span className="tabular w-14 shrink-0 text-right text-xs text-fg-faint">
                          {formatNumber(version.nodes)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-fg-faint">
                    {versions.newest
                      ? t("versions.noteNewest", {
                          reporting: versions.reporting,
                          coverage: formatPercent(versions.coverage, 1),
                          newest: versions.newest,
                        })
                      : t("versions.note", {
                          reporting: versions.reporting,
                          coverage: formatPercent(versions.coverage, 1),
                        })}
                  </p>
                </>
              )}
            </CardBody>
          </Card>
        ) : (
          <ScanLog scan={scan} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t("regions.title")}
            action={<span className="text-xs text-fg-faint">{t("regions.action")}</span>}
          />
          <CardBody>
            <ul className="flex flex-col gap-2">
              {regions.map((region) => {
                const active = regionFilter === region.region;
                return (
                  <li key={region.region}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setRegionFilter(active ? null : String(region.region));
                        setSelected(null);
                      }}
                      className={`flex w-full items-center gap-3 rounded-sm px-1.5 py-1 text-left text-sm hover:bg-surface-2 ${active ? "bg-surface-2" : ""}`}
                    >
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        style={{ background: regionColor(region.region) }}
                        aria-hidden="true"
                      />
                      <span className="w-32 shrink-0 truncate text-fg">
                        {names.region(region.region)}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${Math.max(1, region.share * 100)}%`,
                            background: regionColor(region.region),
                          }}
                        />
                      </div>
                      <span className="tabular w-12 shrink-0 text-right text-xs text-fg-muted">
                        {formatPercent(region.share, 1)}
                      </span>
                      <span className="tabular hidden w-20 shrink-0 text-right text-xs text-fg-faint sm:block">
                        {formatNumber(region.nodes)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {dash ? (
          <Card>
            <CardHeader
              title={t("reach.title")}
              action={<span className="text-xs text-fg-faint">{t("reach.action")}</span>}
            />
            <CardBody className="flex flex-col gap-3">
              <ul className="flex flex-col gap-2">
                {transport.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 text-sm">
                    <span className="flex w-24 shrink-0 items-center gap-1 text-fg">
                      {t(`reach.${row.id}`)}
                      <Tooltip text={t(`reach.${row.id}Hint`)} />
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${Math.max(1, (row.share ?? 0) * 100)}%` }}
                      />
                    </div>
                    <span className="tabular w-12 shrink-0 text-right text-xs text-fg-muted">
                      {row.share !== null ? formatPercent(row.share, 1) : "—"}
                    </span>
                    <span className="tabular w-16 shrink-0 text-right text-xs text-fg-faint">
                      {row.nodes !== null ? formatNumber(row.nodes) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-fg-faint">{t("reach.overlap")}</p>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader
          title={filtered ? t("countries.titleFiltered") : t("countries.title")}
          action={
            <span className="text-xs text-fg-faint">
              {t("countries.action", { nodes: matchedNodes, countries: matchedRows.length })}
            </span>
          }
        />
        <CardBody>
          {matchedRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">
              {rows.length === 0 ? t("countries.scanWaiting") : t("countries.noMatch")}
            </p>
          ) : (
            <>
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label={t("countries.tableLabel")}
              >
                <Table>
                  <thead>
                    <tr>
                      <Th className="text-right">#</Th>
                      <Th>{t("countries.country")}</Th>
                      <Th className="hidden sm:table-cell">{t("countries.region")}</Th>
                      <Th className="text-right">{t("countries.nodes")}</Th>
                      <Th className="w-2/5">{t("countries.share")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCountries.map((row) => (
                      <Tr
                        key={row.key}
                        className={`cursor-pointer ${selected === row.key ? "bg-surface-2" : ""}`}
                        onClick={() => selectCountry(selected === row.key ? null : row.key)}
                        onMouseEnter={() => setHovered(row.key)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <Td className="tabular text-right text-xs text-fg-faint">{row.rank}</Td>
                        <Td>
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block size-2 shrink-0 rounded-full"
                              style={{ background: regionColor(row.region) }}
                              aria-hidden="true"
                            />
                            <span className="mono text-[10px] font-semibold uppercase text-fg-faint">
                              {row.code}
                            </span>
                            {names.country(row)}
                          </span>
                        </Td>
                        <Td className="hidden text-xs text-fg-muted sm:table-cell">
                          {names.region(row.region)}
                        </Td>
                        <Td className="tabular text-right">{formatNumber(row.nodes)}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                              <div
                                className="h-full rounded-full transition-[width] duration-500"
                                style={{
                                  width: `${Math.max(1, row.share * 100)}%`,
                                  background: regionColor(row.region),
                                }}
                              />
                            </div>
                            <span className="tabular w-10 text-right text-xs text-fg-muted">
                              {formatPercent(row.share, 1)}
                            </span>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {matchedRows.length > COUNTRY_ROWS ? (
                <button
                  type="button"
                  className="mt-2 text-xs text-accent hover:underline"
                  onClick={() => setShowAllCountries((open) => !open)}
                >
                  {showAllCountries
                    ? t("countries.showTop", { count: COUNTRY_ROWS })
                    : t("countries.showAll", { count: matchedRows.length })}
                </button>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      {dash ? <MapHistory snapshot={dash} /> : null}

      {!endpoints.isCoinset ? (
        <PeerTables
          peers={connections.data}
          geo={peerGeo.data}
          loading={connections.isLoading}
          error={connections.error}
        />
      ) : null}

      <Card>
        <CardHeader title={t("about.title")} />
        <CardBody className="grid gap-3 text-sm text-fg-muted sm:grid-cols-2">
          <p>
            {dash
              ? t.rich("about.shows", { age: snapshotAge, b: bold })
              : t.rich("about.showsScan", { b: bold })}
          </p>
          <p>{t.rich("about.notShows", { b: bold })}</p>
        </CardBody>
      </Card>

      <p className="text-xs text-fg-faint">
        {dash
          ? t.rich(unaccounted !== 0 ? "sourceGap" : "source", {
              observed: new Date(dash.observedAt).toISOString().slice(0, 16).replace("T", " "),
              placed,
              total: dash.total,
              gap: Math.abs(unaccounted),
              link: (c) => (
                <a
                  href={dash.source}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-accent hover:underline"
                >
                  {c}
                </a>
              ),
            })
          : t("scan.source")}{" "}
        {t.rich("attribution", {
          link: (c) => (
            <a
              href={SNAPSHOT?.source ?? DASHBOARD_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent hover:underline"
            >
              {c}
            </a>
          ),
        })}
        {endpoints.isCoinset ? ` ${t("ownNodeHint")}` : null}
      </p>
    </div>
  );
}

/** Hover/selection read-out over the map: everything the snapshot knows about one country. */
function CountryDetail({
  row,
  peers,
  scan,
}: {
  row: CountryRow | null;
  peers: number;
  /** Seeder-scan fallback: shares are of the located nodes and there is a last-seen time. */
  scan: boolean;
}) {
  const t = useT("map");
  const names = useMapNames();
  return (
    <div
      role="status"
      className="pointer-events-none absolute left-3 top-3 w-56 rounded-sm border border-border bg-bg-elevated/95 px-3 py-2 shadow-card backdrop-blur-sm"
      style={{ visibility: row ? "visible" : "hidden" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-2.5 shrink-0 rounded-full"
          style={{ background: row ? regionColor(row.region) : "transparent" }}
          aria-hidden="true"
        />
        <span className="truncate text-sm font-medium text-fg">
          {row ? names.country(row) : "—"}
        </span>
        <span className="mono ml-auto text-[10px] uppercase text-fg-faint">{row?.code ?? ""}</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <dt className="text-fg-faint">{t("detail.nodes")}</dt>
        <dd className="tabular text-right text-fg">{row ? formatNumber(row.nodes) : "—"}</dd>
        <dt className="text-fg-faint">{t("detail.share")}</dt>
        <dd className="tabular text-right text-fg">{row ? formatPercent(row.share, 2) : "—"}</dd>
        <dt className="text-fg-faint">{t("detail.rank")}</dt>
        <dd className="tabular text-right text-fg">{row ? `#${row.rank}` : "—"}</dd>
        <dt className="text-fg-faint">{t("detail.region")}</dt>
        <dd className="truncate text-right text-fg">{row ? names.region(row.region) : "—"}</dd>
        {row?.lastSeen ? (
          <>
            <dt className="text-fg-faint">{t("detail.lastSeen")}</dt>
            <dd className="truncate text-right text-fg">{formatAge(row.lastSeen)}</dd>
          </>
        ) : null}
        {peers > 0 ? (
          <>
            <dt className="text-fg-faint">{t("detail.yourPeers")}</dt>
            <dd className="tabular text-right text-accent">{formatNumber(peers)}</dd>
          </>
        ) : null}
      </dl>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(2, (row?.share ?? 0) * 100)}%`,
            background: row ? regionColor(row.region) : "transparent",
          }}
        />
      </div>
      <p className="mt-1.5 text-[10px] leading-tight text-fg-faint">
        {scan ? t("detail.noteScan") : t("detail.note")}
      </p>
    </div>
  );
}

function PeerTables({
  peers,
  geo,
  loading,
  error,
}: {
  peers: PeerConnection[] | undefined;
  geo: Map<string, NodeGeo | null> | undefined;
  loading: boolean;
  error: unknown;
}) {
  const t = useT("map");
  const typeName = (type: number) =>
    isKnownType(type)
      ? t(`peers.types.${CONNECTION_TYPE[type]}`)
      : t("peers.unknownType", { type: String(type) });
  if (error) {
    return (
      <EmptyState
        tone="danger"
        title={t("peers.errorTitle")}
        description={t("peers.errorDescription")}
      />
    );
  }
  if (loading && !peers) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  const rows = peers ?? [];
  const byType = new Map<number, number>();
  rows.forEach((p) => byType.set(p.type, (byType.get(p.type) ?? 0) + 1));
  const peak = rows.reduce((max, p) => Math.max(max, p.peakHeight ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[...byType.entries()].map(([type, count]) => (
          <div key={type} className="rounded-sm border border-border bg-bg-elevated px-3 py-2">
            <div className="text-[11px] uppercase tracking-wider text-fg-muted">
              {typeName(type)}
            </div>
            <div className="tabular text-lg font-semibold">{formatNumber(count)}</div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="col-span-full py-2 text-sm text-fg-faint">{t("peers.none")}</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <Card>
          <CardHeader
            title={t("peers.title")}
            action={
              <span className="text-xs text-fg-faint">
                {t("peers.action", { count: rows.length })}
              </span>
            }
          />
          <CardBody>
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={t("peers.tableLabel")}
            >
              <Table>
                <thead>
                  <tr>
                    <Th>{t("peers.peer")}</Th>
                    <Th>{t("peers.type")}</Th>
                    <Th className="hidden lg:table-cell">{t("peers.location")}</Th>
                    <Th className="hidden xl:table-cell">{t("peers.network")}</Th>
                    <Th className="hidden text-right md:table-cell">{t("peers.peakHeight")}</Th>
                    <Th className="hidden text-right sm:table-cell">{t("peers.sentReceived")}</Th>
                    <Th className="hidden text-right lg:table-cell">{t("peers.connected")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const place = geo?.get(p.peerHost.toLowerCase());
                    const behind = p.peakHeight !== null && peak > 0 ? peak - p.peakHeight : null;
                    return (
                      <Tr key={p.nodeId}>
                        <Td className="mono text-xs">
                          {p.peerHost}:{p.peerPort}
                        </Td>
                        <Td>{typeName(p.type)}</Td>
                        <Td className="hidden text-xs lg:table-cell">
                          {place ? (
                            <span className="flex items-center gap-1.5">
                              <span className="mono text-[10px] uppercase text-fg-faint">
                                {place.countryCode}
                              </span>
                              {place.city ? `${place.city}, ${place.country}` : place.country}
                            </span>
                          ) : (
                            <span className="text-fg-faint">—</span>
                          )}
                        </Td>
                        <Td className="hidden max-w-[16rem] truncate text-xs text-fg-muted xl:table-cell">
                          {place?.org ?? "—"}
                        </Td>
                        <Td className="tabular hidden text-right md:table-cell">
                          {p.peakHeight !== null ? formatNumber(p.peakHeight) : "—"}
                          {behind !== null && behind > 0 ? (
                            <span className="ml-1 text-[10px] text-warning">
                              −{formatNumber(behind)}
                            </span>
                          ) : null}
                        </Td>
                        <Td className="tabular hidden text-right sm:table-cell">
                          {byteRate(p.bytesWritten)} / {byteRate(p.bytesRead)}
                        </Td>
                        <Td className="tabular hidden text-right lg:table-cell">
                          {p.creationTimeS !== null ? formatAge(p.creationTimeS * 1000) : "—"}
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}

function ConcentrationTile({
  spread,
  top,
}: {
  spread: ReturnType<typeof concentration>;
  top: CountryRow | null;
}) {
  const t = useT("map");
  const names = useMapNames();
  return (
    <StatTile
      label={t("stats.concentration")}
      value={
        spread.countriesForHalf > 0
          ? t("stats.concentrationValue", { count: spread.countriesForHalf })
          : "—"
      }
      sub={
        spread.topLabel && top
          ? t("stats.concentrationSub", {
              country: names.country(top),
              share: formatPercent(spread.topShare, 1),
            })
          : undefined
      }
      tone={spread.countriesForHalf > 0 && spread.countriesForHalf <= 3 ? "warning" : "default"}
      hint={t("stats.concentrationHint")}
    />
  );
}

/** The fallback's own figures: what this browser has found, located and when it last heard. */
function ScanTiles({
  scan,
  rows,
  spread,
}: {
  scan: NodeScanState;
  rows: CountryRow[];
  spread: ReturnType<typeof concentration>;
}) {
  const t = useT("map");
  const found = Object.keys(scan.registry.nodes).length;
  const located = rows.reduce((sum, row) => sum + row.nodes, 0);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label={t("scan.found")}
        value={formatNumber(found)}
        sub={t("scan.foundSub", { count: scan.scans })}
        tone="primary"
        hint={t("scan.foundHint")}
      />
      <StatTile
        label={t("scan.located")}
        value={formatNumber(located)}
        sub={t("scan.locatedSub", { count: scan.pendingGeo })}
        hint={t("scan.locatedHint")}
      />
      <StatTile
        label={t("stats.countries")}
        value={formatNumber(rows.length)}
        sub={t("stats.countriesSub", { count: located })}
        hint={t("scan.countriesHint")}
      />
      <ConcentrationTile spread={spread} top={rows[0] ?? null} />
      <StatTile
        label={t("scan.lastAnswer")}
        value={scan.lastScanAt !== null ? formatAge(scan.lastScanAt) : "—"}
        sub={scan.scanning ? t("scan.scanning") : t("scan.pausedHidden")}
        hint={t("scan.lastAnswerHint")}
      />
      <StatTile
        label={t("stats.snapshot")}
        value={t("stats.unavailable")}
        sub={t("scan.snapshotSub")}
        tone="warning"
        hint={t("stats.snapshotHint")}
      />
    </div>
  );
}

/** The latest seeder answers, newest first: which introducer, which record type, what it added. */
function ScanLog({ scan }: { scan: NodeScanState }) {
  const t = useT("map");
  return (
    <Card>
      <CardHeader
        title={t("scan.logTitle")}
        action={
          <span className="text-xs text-fg-faint">
            {t("scan.logAction", { seconds: SCAN_INTERVAL_MS / 1000 })}
          </span>
        }
      />
      <CardBody>
        {scan.log.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-faint">{t("scan.logWaiting")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60 text-sm">
            {scan.log.map((entry) => (
              <li
                key={`${entry.t}:${entry.seeder}:${entry.type}`}
                className="flex flex-wrap items-center justify-between gap-2 py-1.5"
              >
                <span className="mono truncate text-xs text-fg">
                  {entry.seeder} <span className="text-fg-faint">{entry.type}</span>
                </span>
                <span className="tabular text-xs text-fg-muted">
                  {entry.error
                    ? t("scan.logError")
                    : t("scan.logEntry", { answered: entry.answered, added: entry.added })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
