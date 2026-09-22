"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { regionColor } from "@/shared/lib/map/colors";
import type { DashboardSnapshot } from "@/shared/lib/map/dashboard";
import dashboardSnapshot from "@/shared/lib/map/dashboardSnapshot.json";
import { lookupGeo, type NodeGeo } from "@/shared/lib/map/geo";
import { isPublicIp } from "@/shared/lib/map/seeders";
import {
  concentration,
  countryRows,
  regionRows,
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
import { WorldMap, type MapHandle, type MapPulse, type PeerMarker } from "./WorldMap";

const CONNECTION_TYPE: Record<number, string> = {
  0: "Full node",
  1: "Harvester",
  2: "Farmer",
  3: "Timelord",
  4: "Introducer",
  5: "Wallet",
};
const COUNTRY_ROWS = 15;
const FEED_LIMIT = 10;
const PULSE_MS = 1_600;
const DASHBOARD = dashboardSnapshot as DashboardSnapshot;

function byteRate(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
function useActivity(rows: CountryRow[]) {
  const peakHeight = useLiveValue("peakHeight");
  const txBatch = useLiveValue("txBatch");
  const lastTxEvent = useLiveValue("lastTxEvent");
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [pulses, setPulses] = useState<MapPulse[]>([]);
  const [counts, setCounts] = useState({ blocks: 0, bundles: 0 });
  const seq = useRef(0);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
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
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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

  const forNetwork = DASHBOARD.network === endpoints.network;
  const rows = useMemo(() => (forNetwork ? countryRows(DASHBOARD) : []), [forNetwork]);
  const regions = useMemo(() => regionRows(rows), [rows]);
  const versions = useMemo(() => versionBreakdown(DASHBOARD), []);
  const transport = useMemo(() => transportRows(DASHBOARD), []);
  const spread = useMemo(() => concentration(rows), [rows]);
  /** Nodes the country panel accounts for; the total-nodes panel is a separate query. */
  const placed = useMemo(() => rows.reduce((sum, row) => sum + row.nodes, 0), [rows]);
  const unaccounted = forNetwork ? DASHBOARD.total - placed : 0;

  const activity = useActivity(rows);

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
          row.code.toLowerCase() === trimmed ||
          String(row.region).toLowerCase().includes(trimmed)
        );
      }),
    [rows, trimmed, regionFilter]
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

  const snapshotAge = forNetwork ? formatAge(new Date(DASHBOARD.observedAt).getTime()) : "—";
  const visibleCountries = showAllCountries ? matchedRows : matchedRows.slice(0, COUNTRY_ROWS);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Network map</h1>
          <Tooltip
            text="Every figure on this page comes from Chia's published Peer Info dashboard snapshot. Country markers show aggregate node populations at representative points; no browser crawler or address harvesting is needed."
            placement="bottom"
          />
        </div>
        <p className="max-w-3xl text-sm text-fg-muted">
          Where the Chia full-node population sits, what it runs and what the network is doing right
          now. Search or pick a region to narrow the map, then click a country for its detail.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label="Full nodes"
          value={formatNumber(forNetwork ? DASHBOARD.total : 0)}
          sub={forNetwork ? `seen in the last 5 days` : "mainnet only"}
          tone="primary"
          hint="Full-node population reported by Chia's Peer Info dashboard over a five-day window."
        />
        <StatTile
          label="Reliable"
          value={DASHBOARD.capacity !== null ? formatNumber(DASHBOARD.capacity) : "—"}
          sub={
            DASHBOARD.capacity !== null
              ? `${formatPercent(DASHBOARD.capacity / DASHBOARD.total, 1)} of the network`
              : undefined
          }
          hint="Nodes stable enough that the crawler hands them out through the DNS introducers."
        />
        <StatTile
          label="IPv6"
          value={DASHBOARD.ipv6 !== null ? formatPercent(DASHBOARD.ipv6 / DASHBOARD.total, 1) : "—"}
          sub={DASHBOARD.ipv6 !== null ? `${formatNumber(DASHBOARD.ipv6)} nodes` : undefined}
          hint="Share of the population the crawler reached over IPv6. A node can answer on both."
        />
        <StatTile
          label="Countries"
          value={formatNumber(rows.length)}
          sub={`${formatNumber(placed)} nodes placed`}
          hint="Countries the crawler reported, all of them with a representative point on the map."
        />
        <StatTile
          label="Concentration"
          value={
            spread.countriesForHalf > 0 ? `${formatNumber(spread.countriesForHalf)} countries` : "—"
          }
          sub={
            spread.topLabel
              ? `${spread.topLabel} holds ${formatPercent(spread.topShare, 1)}`
              : undefined
          }
          tone={spread.countriesForHalf > 0 && spread.countriesForHalf <= 3 ? "warning" : "default"}
          hint="How many of the largest countries it takes to hold half of all full nodes."
        />
        <StatTile
          label="Snapshot"
          value={snapshotAge}
          sub={forNetwork ? "last observed" : "unavailable"}
          hint="Age of the dashboard capture this page is drawn from."
        />
      </div>

      <Card>
        <CardHeader
          title="Chia full nodes — live"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={showArcs}
                className={`map-toggle ${showArcs ? "map-toggle-active" : ""}`}
                onClick={() => setShowArcs((on) => !on)}
              >
                Modelled reach
              </button>
              <div className="flex overflow-hidden rounded-sm border border-border bg-bg-elevated">
                <button
                  type="button"
                  aria-label="Zoom in"
                  className="map-control"
                  onClick={() => map.current?.zoomBy(1.4)}
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label="Zoom out"
                  className="map-control"
                  onClick={() => map.current?.zoomBy(1 / 1.4)}
                >
                  −
                </button>
                <button
                  type="button"
                  aria-label="Reset map view"
                  className="map-control map-control-wide"
                  onClick={() => {
                    setQuery("");
                    setSuggest(false);
                    setRegionFilter(null);
                    setSelected(null);
                    map.current?.reset();
                  }}
                >
                  reset
                </button>
              </div>
            </div>
          }
        />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="map-location-search" className="sr-only">
                Filter the map by country or region
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
                placeholder="filter the map — country, code or region"
                className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-primary"
              />
              {suggest && trimmed && matchedRows.length > 0 ? (
                <div className="absolute z-20 mt-1 flex w-full flex-col rounded-sm border border-border bg-bg-elevated p-1 shadow-card">
                  {matchedRows.slice(0, 6).map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => {
                        setQuery(row.label);
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
                        <span className="text-accent">{row.label}</span>
                        <span className="text-fg-faint">#{row.rank}</span>
                      </span>
                      <span className="tabular text-fg-faint">{formatNumber(row.nodes)} nodes</span>
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
                    {region.region}
                    <span className="tabular text-fg-faint">{formatNumber(region.nodes)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-faint">
            <span>
              {filtered
                ? `${formatNumber(matchedRows.length)} of ${formatNumber(rows.length)} countries · ${formatNumber(matchedNodes)} nodes (${formatPercent(DASHBOARD.total > 0 ? matchedNodes / DASHBOARD.total : 0, 1)})`
                : `${formatNumber(DASHBOARD.total)} full nodes · ${formatNumber(rows.length)} countries`}
            </span>
            <span className="tabular">
              drag to pan · double-click or ⌘/ctrl + wheel to zoom · {scale.toFixed(1)}×
            </span>
          </div>

          <div className="relative">
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
              onViewChange={setScale}
            />
            <CountryDetail
              row={detail}
              peers={detail ? (peersByCountry.get(detail.label) ?? 0) : 0}
            />
            {filtered && matchedRows.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="rounded-sm border border-border bg-bg-elevated/95 px-3 py-2 text-xs text-fg-muted shadow-card">
                  No country matches “{query}”.
                </span>
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Live activity as seen by this node"
            action={
              <span className="tabular text-xs text-fg-faint">
                {formatNumber(activity.counts.blocks)} blocks ·{" "}
                {formatNumber(activity.counts.bundles)} bundles
              </span>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {activity.feed.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-faint">Waiting for the first event…</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60 text-sm" aria-live="polite">
                {activity.feed.map((e) => (
                  <li
                    key={e.id}
                    className="animate-row-in flex flex-wrap items-center justify-between gap-2 py-1.5 pl-2"
                  >
                    {e.kind === "block" ? (
                      <span>
                        New peak{" "}
                        <Link
                          href={routes.block(e.height!)}
                          className="text-accent hover:underline"
                        >
                          #{formatNumber(e.height!)}
                        </Link>
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

        <Card>
          <CardHeader
            title="Node versions"
            action={
              <span className="tabular text-xs text-fg-faint">
                {formatNumber(versions.reporting)} nodes report a version
              </span>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {versions.rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-faint">
                The snapshot carries no version panel.
              </p>
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
                  Shares are of the {formatNumber(versions.reporting)} nodes whose version the
                  crawler knows ({formatPercent(versions.coverage, 1)} of the population)
                  {versions.newest ? `; ${versions.newest} is the newest build reported` : ""}.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Regions"
            action={<span className="text-xs text-fg-faint">click to filter the map</span>}
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
                      <span className="w-32 shrink-0 truncate text-fg">{region.region}</span>
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

        <Card>
          <CardHeader
            title="Reachability"
            action={<span className="text-xs text-fg-faint">five-day crawler window</span>}
          />
          <CardBody className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {transport.map((row) => (
                <li key={row.label} className="flex items-center gap-3 text-sm">
                  <span className="flex w-24 shrink-0 items-center gap-1 text-fg">
                    {row.label}
                    <Tooltip text={row.hint} />
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
            <p className="text-xs text-fg-faint">
              IPv4 and IPv6 shares overlap: a dual-stack node is counted in both, so they add up to
              more than the population.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={filtered ? "Countries — filtered" : "Countries"}
          action={
            <span className="text-xs text-fg-faint">
              {formatNumber(matchedNodes)} nodes in {formatNumber(matchedRows.length)} countries
            </span>
          }
        />
        <CardBody>
          {matchedRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">
              {rows.length === 0
                ? "No dashboard snapshot for this network."
                : "No country matches the current filter."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Countries">
                <Table>
                  <thead>
                    <tr>
                      <Th className="text-right">#</Th>
                      <Th>Country</Th>
                      <Th className="hidden sm:table-cell">Region</Th>
                      <Th className="text-right">Nodes</Th>
                      <Th className="w-2/5">Share</Th>
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
                            {row.label}
                          </span>
                        </Td>
                        <Td className="hidden text-xs text-fg-muted sm:table-cell">{row.region}</Td>
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
                    ? "Show the top 15 only"
                    : `Show all ${formatNumber(matchedRows.length)} countries`}
                </button>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      {!endpoints.isCoinset ? (
        <PeerTables
          peers={connections.data}
          geo={peerGeo.data}
          loading={connections.isLoading}
          error={connections.error}
        />
      ) : null}

      <Card>
        <CardHeader title="What this map is" />
        <CardBody className="grid gap-3 text-sm text-fg-muted sm:grid-cols-2">
          <p>
            <strong className="text-fg">What it shows.</strong> Country-level full-node populations
            from Chia&apos;s Peer Info dashboard, captured{" "}
            {forNetwork ? snapshotAge : "for mainnet"}, plus the connected peers of a configured
            node. Marker size is the node count; colour is the region.
          </p>
          <p>
            <strong className="text-fg">What it is not.</strong> Chia does not publish node
            coordinates, nor where a block was farmed or a spend bundle came from. Markers sit at
            one representative point per country, and the reach arcs and pulses are a model of
            propagation, not a packet route.
          </p>
        </CardBody>
      </Card>

      <p className="text-xs text-fg-faint">
        Source:{" "}
        <a
          href={DASHBOARD.source}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent hover:underline"
        >
          Chia Peer Info dashboard
        </a>
        , observed{" "}
        {forNetwork
          ? new Date(DASHBOARD.observedAt).toISOString().slice(0, 16).replace("T", " ")
          : "—"}{" "}
        UTC. The country panel accounts for {formatNumber(placed)} of the{" "}
        {formatNumber(DASHBOARD.total)} nodes the population panel reports
        {unaccounted !== 0
          ? `; the ${formatNumber(Math.abs(unaccounted))}-node gap is between two separate dashboard queries, not a rounding error`
          : ""}
        . Only node addresses are ever sent to a geolocation service, never the visitor&apos;s.{" "}
        {endpoints.isCoinset
          ? "Point Settings at your own node to also see its connected peers here."
          : null}
      </p>
    </div>
  );
}

/** Hover/selection read-out over the map: everything the snapshot knows about one country. */
function CountryDetail({ row, peers }: { row: CountryRow | null; peers: number }) {
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
        <span className="truncate text-sm font-medium text-fg">{row?.label ?? "—"}</span>
        <span className="mono ml-auto text-[10px] uppercase text-fg-faint">{row?.code ?? ""}</span>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <dt className="text-fg-faint">Nodes</dt>
        <dd className="tabular text-right text-fg">{row ? formatNumber(row.nodes) : "—"}</dd>
        <dt className="text-fg-faint">Share</dt>
        <dd className="tabular text-right text-fg">{row ? formatPercent(row.share, 2) : "—"}</dd>
        <dt className="text-fg-faint">Rank</dt>
        <dd className="tabular text-right text-fg">{row ? `#${row.rank}` : "—"}</dd>
        <dt className="text-fg-faint">Region</dt>
        <dd className="truncate text-right text-fg">{row?.region ?? "—"}</dd>
        {peers > 0 ? (
          <>
            <dt className="text-fg-faint">Your peers</dt>
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
        Dashboard estimate at a representative point, not a located node.
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
  if (error) {
    return (
      <EmptyState
        tone="danger"
        title="Could not read connections"
        description="Your node did not answer get_connections."
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
              {CONNECTION_TYPE[type] ?? `Type ${type}`}
            </div>
            <div className="tabular text-lg font-semibold">{formatNumber(count)}</div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="col-span-full py-2 text-sm text-fg-faint">No peer connections reported.</p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <Card>
          <CardHeader
            title="Your node's connections"
            action={
              <span className="text-xs text-fg-faint">
                {formatNumber(rows.length)} peers · refreshes every 15 s
              </span>
            }
          />
          <CardBody>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Connections">
              <Table>
                <thead>
                  <tr>
                    <Th>Peer</Th>
                    <Th>Type</Th>
                    <Th className="hidden lg:table-cell">Location</Th>
                    <Th className="hidden xl:table-cell">Network</Th>
                    <Th className="hidden text-right md:table-cell">Peak height</Th>
                    <Th className="hidden text-right sm:table-cell">Sent / received</Th>
                    <Th className="hidden text-right lg:table-cell">Connected</Th>
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
                        <Td>{CONNECTION_TYPE[p.type] ?? `Type ${p.type}`}</Td>
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
