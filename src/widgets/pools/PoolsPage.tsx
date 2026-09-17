"use client";

import { useState } from "react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { summarizePoolShare } from "@/shared/lib/pools/share";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Button, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { poolColor, PoolShareBar } from "./PoolShareBar";
import { POOL_SHARE_WINDOW, usePoolShare } from "./usePoolShare";

export function PoolsPage() {
  const { networkConfig } = useSettings();
  const query = usePoolShare();
  const summary = query.data ? summarizePoolShare(query.data.share) : null;
  const [showAllUnidentified, setShowAllUnidentified] = useState(false);
  const unidentifiedRows = query.data ? query.data.share.rows.filter((r) => r.entry === null) : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Pools</h1>
          <Tooltip
            text={`Share of the last ${formatNumber(POOL_SHARE_WINDOW)} blocks by pool payout puzzle hash, grouped client-side from Coinset's get_block_records — nothing is stored on our server (decision-012). Names come from a maintained registry keyed by verified payout addresses; every payout address with no registry match is combined into one "Unidentified" total below.`}
            placement="bottom"
          />
        </div>
      </header>

      <Card>
        <CardHeader
          title="Share by pool"
          action={
            query.data ? (
              <span className="tabular text-xs text-fg-faint">
                heights {formatNumber(query.data.windowStart)} –{" "}
                {formatNumber(query.data.windowEnd)}
              </span>
            ) : null
          }
        />
        <CardBody className="flex flex-col gap-4">
          {query.error ? (
            <EmptyState
              tone="danger"
              title="Could not load pool share"
              description={String((query.error as Error).message)}
            />
          ) : !summary ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-full" />
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <>
              <PoolShareBar summary={summary} />
              <div role="region" aria-label="Share by pool">
                <ul className="flex flex-col divide-y divide-border/60">
                  {summary.named.map((row, i) => {
                    const address = puzzleHashToAddress(
                      row.poolPuzzleHashes[0]!,
                      networkConfig.addressPrefix
                    );
                    return (
                      <li
                        key={row.entry.name}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: poolColor(i) }}
                        />
                        <span className="flex min-w-[140px] items-center gap-1.5 font-medium text-fg">
                          <a
                            href={row.entry.url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-accent hover:underline"
                          >
                            {row.entry.name}
                          </a>
                          <Tooltip
                            text={`Verified via ${row.entry.source}. ${row.poolPuzzleHashes.length > 1 ? `${row.poolPuzzleHashes.length} payout addresses seen in this window.` : "Payout address confirmed against the pool's own pool_info endpoint."}`}
                          />
                        </span>
                        <Hash
                          value={address}
                          href={routes.address(address)}
                          head={8}
                          tail={4}
                          copy
                          className="text-xs text-fg-faint"
                        />
                        <span className="tabular ml-auto text-sm text-fg-muted">
                          {formatNumber(row.blocks)} blocks
                        </span>
                        <span className="tabular w-14 text-right text-sm font-medium text-fg">
                          {formatPercent(row.share, 1)}
                        </span>
                      </li>
                    );
                  })}
                  {summary.unidentified ? (
                    <li className="flex flex-col gap-2 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-full bg-border-strong"
                        />
                        <span className="flex min-w-[140px] items-center gap-1.5 font-medium text-fg-faint">
                          Unidentified
                          <Tooltip
                            text={`${formatNumber(summary.unidentified.addressCount)} distinct payout addresses in this window with no registry match — each is either an unregistered pool or a solo farmer paying out to their own address. Grouped together since most represent one or a handful of blocks each.`}
                          />
                        </span>
                        <span className="tabular ml-auto text-sm text-fg-muted">
                          {formatNumber(summary.unidentified.blocks)} blocks
                        </span>
                        <span className="tabular w-14 text-right text-sm font-medium text-fg">
                          {formatPercent(summary.unidentified.share, 1)}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAllUnidentified((v) => !v)}
                          aria-expanded={showAllUnidentified}
                        >
                          {showAllUnidentified ? "Hide" : "Show"} all{" "}
                          {formatNumber(summary.unidentified.addressCount)} addresses
                        </Button>
                      </div>
                      {showAllUnidentified ? (
                        <ul className="flex max-h-80 flex-col divide-y divide-border/40 overflow-y-auto rounded-sm border border-border bg-bg pl-[26px]">
                          {unidentifiedRows.map((row) => {
                            const address = puzzleHashToAddress(
                              row.poolPuzzleHash,
                              networkConfig.addressPrefix
                            );
                            return (
                              <li
                                key={row.poolPuzzleHash}
                                className="flex items-center gap-3 px-2.5 py-1.5"
                              >
                                <Hash
                                  value={address}
                                  href={routes.address(address)}
                                  head={10}
                                  tail={6}
                                  copy
                                  className="text-xs text-fg-faint"
                                />
                                <span className="tabular ml-auto text-xs text-fg-muted">
                                  {formatNumber(row.blocks)} blocks
                                </span>
                                <span className="tabular w-12 text-right text-xs text-fg">
                                  {formatPercent(row.share, 1)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  ) : null}
                </ul>
              </div>
            </>
          )}
        </CardBody>
      </Card>
      <p className="text-xs text-fg-faint">
        A block&apos;s pool payout address is exact (it is part of the block record); the name
        attached to it is only as complete as the registry. Missing a pool you know the payout
        address for? Add a sourced entry to{" "}
        <span className="mono">src/shared/lib/pools/registry.json</span> (see the wiki&apos;s
        contribution note) with a link to where the address was confirmed, such as the pool&apos;s
        own <span className="mono">pool_info</span> endpoint.
      </p>
    </div>
  );
}
