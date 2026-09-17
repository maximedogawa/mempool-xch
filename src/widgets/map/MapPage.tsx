"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { queryKeys } from "@/shared/api/queryKeys";
import { routes } from "@/shared/lib/routes";
import type { PeerConnection } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader, EmptyState, Skeleton, Table, Td, Th, Tr } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";

const CONNECTION_TYPE: Record<number, string> = { 0: "Full node", 1: "Harvester", 2: "Farmer", 3: "Timelord", 4: "Introducer", 5: "Wallet" };

function byteRate(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MapPage() {
  const { client, endpoints } = useSettings();
  const query = useQuery({
    queryKey: [...queryKeys.chainRoot(endpoints.network), "connections"],
    queryFn: ({ signal }) => client.getConnections(signal),
    enabled: !endpoints.isCoinset,
    refetchInterval: 15_000,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Network</h1>
          <Tooltip
            text="Peers your configured node is connected to right now, read directly from your browser (no server involved, no visitor data collected)."
            placement="bottom"
          />
        </div>
      </header>

      {endpoints.isCoinset ? (
        <EmptyState
          title="Not available on Coinset"
          description={
            <>
              Coinset&apos;s public gateway does not expose <span className="mono">get_connections</span>, so there is no peer list to show here by
              default. Point{" "}
              <Link href={routes.settings()} className="text-accent hover:underline">
                Settings → Full-node RPC endpoint
              </Link>{" "}
              at your own node (see the{" "}
              <a href="https://github.com/maximedogawa/mempool-xch-wiki/blob/main/guides/custom-node.md" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                custom node guide
              </a>
              ) to see its connections here, or run one behind{" "}
              <a href="https://github.com/maximedogawa/nodexch" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                nodexch
              </a>
              . A map with estimated peer locations would need a geo-IP database this app does not bundle (and the app does no
              server-side lookups); this page only shows what your own node reports.
            </>
          }
        />
      ) : (
        <PeerTables peers={query.data} loading={query.isLoading} error={query.error} />
      )}
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
