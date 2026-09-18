"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMempoolSummary } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { lookupGeo } from "@/shared/lib/map/geo";
import { clusterNodes, countByCountry, type NodeCluster } from "@/shared/lib/map/registry";
import { isPublicIp } from "@/shared/lib/map/seeders";
import { routes } from "@/shared/lib/routes";
import type { PeerConnection } from "@/shared/lib/rpc/types";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader, EmptyState, KindBadge, Skeleton, StatTile, Table, Td, Th, Tr } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useNodeScan } from "./useNodeScan";
import { WorldMap, type MapPulse, type PeerMarker } from "./WorldMap";

const CONNECTION_TYPE: Record<number, string> = { 0: "Full node", 1: "Harvester", 2: "Farmer", 3: "Timelord", 4: "Introducer", 5: "Wallet" };
const COUNTRY_ROWS = 12;
const FEED_LIMIT = 10;
const PULSE_MS = 1_600;

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

/** Random cluster, weighted by how many nodes it holds, for the modelled propagation pulses. */
function pickCluster(clusters: NodeCluster[], total: number): NodeCluster | null {
  if (clusters.length === 0 || total === 0) return null;
  let r = Math.random() * total;
  for (const c of clusters) {
    r -= c.nodes.length;
    if (r <= 0) return c;
  }
  return clusters[clusters.length - 1] ?? null;
}

/**
 * Live activity from the tab's own Coinset stream: new peaks and mempool batches, plus pulses
 * on the map. The pulses are a model (random observed nodes), not where anything really came
 * from: Chia does not reveal the origin of a block or a spend bundle.
 */
function useActivity(clusters: NodeCluster[]) {
  const { peakHeight, txBatch, lastTxEvent } = useLive();
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [pulses, setPulses] = useState<MapPulse[]>([]);
  const [counts, setCounts] = useState({ blocks: 0, bundles: 0 });
  const seq = useRef(0);
  const clustersRef = useRef(clusters);
  clustersRef.current = clusters;
  const lastPeak = useRef<number | null>(null);
  const lastBatch = useRef(0);

  const pulse = (kind: MapPulse["kind"], n: number) => {
    const list = clustersRef.current;
    const total = list.reduce((s, c) => s + c.nodes.length, 0);
    const fresh: MapPulse[] = [];
    for (let i = 0; i < n; i += 1) {
      const c = pickCluster(list, total);
      if (c) fresh.push({ id: (seq.current += 1), clusterKey: c.key, kind });
    }
    if (fresh.length === 0) return;
    setPulses((p) => [...p, ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => setPulses((p) => p.filter((x) => !ids.has(x.id))), PULSE_MS);
  };

  useEffect(() => {
    if (peakHeight === null) return;
    if (lastPeak.current === null) {
      lastPeak.current = peakHeight;
      return;
    }
    if (peakHeight <= lastPeak.current) return;
    lastPeak.current = peakHeight;
    setFeed((f) => [{ id: (seq.current += 1), t: Date.now(), kind: "block" as const, height: peakHeight }, ...f].slice(0, FEED_LIMIT));
    setCounts((c) => ({ ...c, blocks: c.blocks + 1 }));
    pulse("block", 6);
  }, [peakHeight]);

  useEffect(() => {
    if (txBatch === lastBatch.current || !lastTxEvent) return;
    lastBatch.current = txBatch;
    if (lastTxEvent.status !== "pending" || lastTxEvent.ids.length === 0) return;
    setFeed((f) => [{ id: (seq.current += 1), t: Date.now(), kind: "bundles" as const, ids: lastTxEvent.ids.slice(0, 3), status: lastTxEvent.status }, ...f].slice(0, FEED_LIMIT));
    setCounts((c) => ({ ...c, bundles: c.bundles + lastTxEvent.ids.length }));
    pulse("bundle", Math.min(3, lastTxEvent.ids.length));
  }, [txBatch, lastTxEvent]);

  return { feed, pulses, counts };
}

export function MapPage() {
  const { client, endpoints } = useSettings();
  const scan = useNodeScan(endpoints.network);
  const [hovered, setHovered] = useState<string | null>(null);
  const nodes = useMemo(() => Object.values(scan.registry.nodes), [scan.registry]);
  const clusters = useMemo(() => clusterNodes(nodes), [nodes]);
  const countries = useMemo(() => countByCountry(scan.registry), [scan.registry]);
  const located = nodes.filter((n) => n.geo).length;
  const ipv6 = nodes.filter((n) => n.ip.includes(":")).length;
  const activity = useActivity(clusters);
  const summary = useMempoolSummary();
  const kindOf = useMemo(() => new Map(summary.data?.items.map((i) => [i.id, i.kind]) ?? []), [summary.data]);
  const hoveredCluster = hovered ? clusters.find((c) => c.key === hovered) : null;

  const connections = useQuery({
    queryKey: [...queryKeys.chainRoot(endpoints.network), "connections"],
    queryFn: ({ signal }) => client.getConnections(signal),
    enabled: !endpoints.isCoinset,
    refetchInterval: 15_000,
  });
  const peerHosts = useMemo(() => [...new Set((connections.data ?? []).map((p) => p.peerHost.toLowerCase()).filter(isPublicIp))].sort(), [connections.data]);
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
        return geo ? [{ host, lat: geo.lat, lon: geo.lon, label: geo.city ? `${geo.city}, ${geo.country}` : geo.country }] : [];
      }),
    [peerHosts, peerGeo.data]
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Network</h1>
          <Tooltip
            text="Full nodes discovered by asking the Chia DNS introducers (the same seeders every node bootstraps from) from your browser, placed with GeoJS city-level estimates. Only node addresses are looked up; nothing about you is sent beyond the requests themselves, and nothing goes through our server."
            placement="bottom"
          />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Observed nodes" value={formatNumber(nodes.length)} sub={scan.scanning ? "scanning…" : "paused"} tone="primary" hint="Distinct node addresses the seeders handed out to this browser; kept for a week per network." />
        <StatTile label="Located" value={formatNumber(located)} sub={scan.pendingGeo > 0 ? `${formatNumber(scan.pendingGeo)} pending` : "all placed"} hint="Nodes GeoJS could place on the map (city-level estimates)." />
        <StatTile label="Countries" value={formatNumber(countries.length)} sub={countries[0] ? `${countries[0].country} leads` : undefined} />
        <StatTile label="IPv6" value={nodes.length > 0 ? formatPercent(ipv6 / nodes.length) : "—"} sub={`${formatNumber(ipv6)} addresses`} />
        <StatTile label="Seeder answers" value={formatNumber(scan.scans)} sub={scan.lastScanAt ? `last ${formatAge(scan.lastScanAt)}` : "waiting for the first"} hint="One seeder is asked every few seconds while this page is open; each answer is a fresh batch of reachable nodes." />
      </div>

      <Card>
        <CardHeader
          title="Node map"
          action={
            <span className="flex flex-wrap items-center gap-3 text-[11px] text-fg-faint">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-primary" /> observed node
              </span>
              {!endpoints.isCoinset ? (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full border-2 border-kind-offer" /> connected peer
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full border border-warning" /> block · <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full border border-primary" /> bundle (modelled)
              </span>
            </span>
          }
        />
        <CardBody className="relative">
          {nodes.length === 0 ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="rounded-sm border border-border bg-bg-elevated/90 px-3 py-2 text-xs text-fg-muted">
                {scan.log[0]?.error ? `The seeders did not answer (${scan.log[0].error}); retrying.` : "Asking the seeders for the first batch of nodes…"}
              </div>
            </div>
          ) : null}
          <WorldMap clusters={clusters} peers={peerMarkers} pulses={activity.pulses} hovered={hovered} onHover={setHovered} />
          <div role="status" className="pointer-events-none absolute left-4 top-4 rounded-sm border border-border bg-bg-elevated/95 px-2.5 py-1.5 text-xs shadow-card" style={{ visibility: hoveredCluster ? "visible" : "hidden" }}>
            <div className="font-medium text-fg">{hoveredCluster?.label ?? "—"}</div>
            <div className="text-fg-muted">
              {hoveredCluster ? `${formatNumber(hoveredCluster.nodes.length)} node${hoveredCluster.nodes.length === 1 ? "" : "s"}` : ""}
              {hoveredCluster?.nodes[0]?.geo?.org ? ` · ${hoveredCluster.nodes[0].geo.org}` : ""}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Countries" action={<span className="text-xs text-fg-faint">{formatNumber(located)} located nodes</span>} />
          <CardBody>
            {countries.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-faint">No located nodes yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Country</Th>
                    <Th className="text-right">Nodes</Th>
                    <Th className="w-1/2">Share</Th>
                  </tr>
                </thead>
                <tbody>
                  {countries.slice(0, COUNTRY_ROWS).map((c) => (
                    <Tr key={c.countryCode}>
                      <Td>
                        <span className="mr-1.5 text-[10px] font-semibold uppercase text-fg-faint">{c.countryCode}</span>
                        {c.country}
                      </Td>
                      <Td className="tabular text-right">{formatNumber(c.nodes)}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg">
                            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(1, c.share * 100)}%` }} />
                          </div>
                          <span className="tabular w-10 text-right text-xs text-fg-muted">{formatPercent(c.share, 1)}</span>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
            {countries.length > COUNTRY_ROWS ? <p className="mt-2 text-xs text-fg-faint">and {formatNumber(countries.length - COUNTRY_ROWS)} more countries.</p> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Live activity"
            action={
              <span className="tabular text-xs text-fg-faint">
                {formatNumber(activity.counts.blocks)} blocks · {formatNumber(activity.counts.bundles)} bundles since opening
              </span>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {activity.feed.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-faint">Waiting for the first event from the live stream…</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60 text-sm" aria-live="polite">
                {activity.feed.map((e) => (
                  <li key={e.id} className="animate-row-in flex flex-wrap items-center justify-between gap-2 py-1.5">
                    {e.kind === "block" ? (
                      <span>
                        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                        New peak{" "}
                        <Link href={routes.block(e.height!)} className="text-accent hover:underline">
                          #{formatNumber(e.height!)}
                        </Link>
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                        {e.ids!.map((id) => (
                          <Link key={id} href={routes.tx(id)} className="mono text-xs text-accent hover:underline">
                            {shortId(id, 6, 4)}
                          </Link>
                        ))}
                        {e.ids!.map((id) => kindOf.get(id)).filter((k): k is NonNullable<typeof k> => !!k && k !== "xch").slice(0, 2).map((k, i) => <KindBadge key={`${k}-${i}`} kind={k} />)}
                      </span>
                    )}
                    <span className="text-xs text-fg-faint">{formatAge(e.t)}</span>
                  </li>
                ))}
              </ul>
            )}
            <details className="text-xs text-fg-faint">
              <summary className="cursor-pointer select-none font-medium text-fg-muted">Scan log</summary>
              <ul className="mt-1 flex flex-col gap-0.5">
                {scan.log.length === 0 ? <li>No seeder asked yet.</li> : null}
                {scan.log.map((s) => (
                  <li key={s.t} className="mono">
                    {new Date(s.t).toLocaleTimeString("en-GB")} {s.seeder} {s.type}: {s.error ? `failed (${s.error})` : `${s.answered} addresses, ${s.added} new`}
                  </li>
                ))}
              </ul>
            </details>
          </CardBody>
        </Card>
      </div>

      {!endpoints.isCoinset ? <PeerTables peers={connections.data} loading={connections.isLoading} error={connections.error} /> : null}

      <p className="text-xs text-fg-faint">
        Node addresses come from the Chia DNS introducers (dns-introducer.chia.net and the community seeders every node ships with) via Cloudflare&apos;s DNS-over-HTTPS; locations are
        city-level estimates by{" "}
        <a href="https://www.geojs.io/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          GeoJS
        </a>{" "}
        using GeoLite2 data by MaxMind. Chia does not reveal where a block was farmed or where a spend bundle came from: the pulses model propagation from random observed nodes and
        are not the route an event travelled. {endpoints.isCoinset ? "Point Settings at your own node to also see its connected peers here." : null}
      </p>
    </div>
  );
}

function PeerTables({ peers, loading, error }: { peers: PeerConnection[] | undefined; loading: boolean; error: unknown }) {
  if (error) {
    return <EmptyState tone="danger" title="Could not read connections" description="Your node did not answer get_connections." />;
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

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[...byType.entries()].map(([type, count]) => (
          <div key={type} className="rounded-sm border border-border bg-bg-elevated px-3 py-2">
            <div className="text-[11px] uppercase tracking-wider text-fg-muted">{CONNECTION_TYPE[type] ?? `Type ${type}`}</div>
            <div className="tabular text-lg font-semibold">{formatNumber(count)}</div>
          </div>
        ))}
        {rows.length === 0 ? <p className="col-span-full py-2 text-sm text-fg-faint">No peer connections reported.</p> : null}
      </div>

      {rows.length > 0 ? (
        <Card>
          <CardHeader title="Connections" action={<span className="text-xs text-fg-faint">{formatNumber(rows.length)} peers · refreshes every 15 s</span>} />
          <CardBody>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Connections">
              <Table>
                <thead>
                  <tr>
                    <Th>Peer</Th>
                    <Th>Type</Th>
                    <Th className="hidden text-right md:table-cell">Peak height</Th>
                    <Th className="hidden text-right sm:table-cell">Sent / received</Th>
                    <Th className="hidden text-right lg:table-cell">Connected</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <Tr key={p.nodeId}>
                      <Td className="mono text-xs">
                        {p.peerHost}:{p.peerPort}
                      </Td>
                      <Td>{CONNECTION_TYPE[p.type] ?? `Type ${p.type}`}</Td>
                      <Td className="tabular hidden text-right md:table-cell">{p.peakHeight !== null ? formatNumber(p.peakHeight) : "—"}</Td>
                      <Td className="tabular hidden text-right sm:table-cell">
                        {byteRate(p.bytesWritten)} / {byteRate(p.bytesRead)}
                      </Td>
                      <Td className="tabular hidden text-right lg:table-cell">{p.creationTimeS !== null ? formatAge(p.creationTimeS * 1000) : "—"}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
