"use client";

import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader, EmptyState, Hash, Skeleton, Table, Td, Th, Tr } from "@/shared/ui";
import { POOL_SHARE_WINDOW, usePoolShare } from "./usePoolShare";

export function PoolsPage() {
  const { networkConfig } = useSettings();
  const query = usePoolShare();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Pools</h1>
        <p className="text-sm text-fg-muted">
          Share of the last {formatNumber(POOL_SHARE_WINDOW)} blocks by pool payout puzzle hash, grouped client-side from Coinset&apos;s{" "}
          <span className="mono">get_block_records</span> — nothing is stored on our server (decision-012). Names come from a maintained registry keyed by
          verified payout addresses; a group with no matching entry is shown by its payout address instead of a guessed name.
        </p>
      </header>

      <Card>
        <CardHeader
          title="Share by pool"
          action={query.data ? <span className="tabular text-xs text-fg-faint">heights {formatNumber(query.data.windowStart)} – {formatNumber(query.data.windowEnd)}</span> : null}
        />
        <CardBody className="flex flex-col gap-3">
          {query.error ? (
            <EmptyState tone="danger" title="Could not load pool share" description={String((query.error as Error).message)} />
          ) : !query.data ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-fg-faint">
                {formatPercent(query.data.share.identifiedShare, 1)} of blocks in this window went to a pool the registry can name;{" "}
                {formatNumber(query.data.share.totalBlocks - query.data.share.identifiedBlocks)} blocks are grouped by payout address only.
              </p>
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Share by pool">
                <Table>
                  <thead>
                    <tr>
                      <Th>Pool</Th>
                      <Th>Payout address</Th>
                      <Th className="text-right">Blocks</Th>
                      <Th className="text-right">Share</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.share.rows.map((row) => {
                      const address = puzzleHashToAddress(row.poolPuzzleHash, networkConfig.addressPrefix);
                      return (
                        <Tr key={row.poolPuzzleHash}>
                          <Td className="font-medium text-fg">
                            {row.entry ? (
                              <a href={row.entry.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                                {row.entry.name}
                              </a>
                            ) : (
                              <span className="text-fg-faint">Unidentified pool or solo farmer</span>
                            )}
                          </Td>
                          <Td>
                            <Hash value={address} href={routes.address(address)} head={10} tail={6} copy />
                          </Td>
                          <Td className="tabular text-right">{formatNumber(row.blocks)}</Td>
                          <Td className="tabular text-right">{formatPercent(row.share, 1)}</Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </CardBody>
      </Card>
      <p className="text-xs text-fg-faint">
        A block&apos;s pool payout address is exact (it is part of the block record); the name attached to it is only as complete as the registry. Missing a
        pool you know the payout address for? Add a sourced entry to <span className="mono">src/shared/lib/pools/registry.json</span> (see the wiki&apos;s
        contribution note) with a link to where the address was confirmed, such as the pool&apos;s own <span className="mono">pool_info</span> endpoint.
      </p>
    </div>
  );
}
