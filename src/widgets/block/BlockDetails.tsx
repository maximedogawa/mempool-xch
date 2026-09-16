"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBlockchainState } from "@/shared/api/hooks";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatCost, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { isNotFound } from "@/shared/lib/rpc/errors";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Badge, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton } from "@/shared/ui";
import { BlockCoins } from "./BlockCoins";
import { BlockTransactions } from "./BlockTransactions";
import { AssetsMoved } from "./AssetsMoved";
import { parseBlockId, useBlock, useBlockAssetTotals, useBlockCoins, useNextTransactionBlock } from "./useBlock";

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-1 border-b border-border/60 py-2 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-3", className)}>
      <dt className="text-xs font-medium uppercase tracking-wider text-fg-muted sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-all">{children}</dd>
    </div>
  );
}

export function BlockDetails({ id }: { id: string }) {
  const { networkConfig } = useSettings();
  const parsed = parseBlockId(id);
  const query = useBlock(id);
  const state = useBlockchainState();
  const { peakHeight } = useLive();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  const blockMaxCost = state.data?.blockMaxCost ?? 11_000_000_000;
  const record = query.data?.record;
  const block = query.data?.block;
  const isTx = record?.isTransactionBlock ?? false;
  const coins = useBlockCoins(record?.headerHash ?? null, isTx);
  const nextTx = useNextTransactionBlock(record?.height ?? null, record !== undefined && !isTx);
  const totals = useBlockAssetTotals(record?.height ?? null, record?.headerHash ?? null, isTx);

  if (!parsed) {
    return <EmptyState tone="danger" title="Invalid block id" description="Use a block height (e.g. 9295514) or a 64-character header hash." />;
  }
  if (query.error) {
    return isNotFound(query.error) ? (
      <EmptyState title="Block not found" description={`No block matches ${id} on ${networkConfig.label}.`} />
    ) : (
      <EmptyState tone="danger" title="Could not load the block" description={String((query.error as Error).message)} />
    );
  }
  if (!record || !block) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    );
  }

  const fill = block.cost / blockMaxCost;
  const farmer = puzzleHashToAddress(record.farmerPuzzleHash, networkConfig.addressPrefix);
  const pool = puzzleHashToAddress(record.poolPuzzleHash, networkConfig.addressPrefix);
  const nextDisabled = peak !== null && record.height >= peak;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
          <span>
            Block <span className="tabular">{formatNumber(record.height)}</span>
          </span>
          {isTx ? <Badge tone="primary">Transaction block</Badge> : <Badge tone="neutral">No transactions</Badge>}
          {peak !== null && record.height === peak ? <Badge tone="info">Peak</Badge> : null}
        </h1>
        <nav aria-label="Block navigation" className="flex gap-2">
          <Link
            href={routes.block(Math.max(0, record.height - 1))}
            aria-disabled={record.height === 0}
            className={cn("inline-flex h-9 items-center gap-1 rounded-sm border border-border px-3 text-sm hover:bg-surface-2", record.height === 0 && "pointer-events-none opacity-50")}
          >
            <ChevronLeft size={16} aria-hidden="true" /> Previous
          </Link>
          <Link
            href={routes.block(record.height + 1)}
            aria-disabled={nextDisabled}
            className={cn("inline-flex h-9 items-center gap-1 rounded-sm border border-border px-3 text-sm hover:bg-surface-2", nextDisabled && "pointer-events-none opacity-50")}
          >
            Next <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </div>

      {isTx ? <AssetsMoved totals={totals.data} loading={totals.isLoading} /> : null}

      <Card>
        <CardHeader title="Details" />
        <CardBody>
          <dl>
            <Row label="Header hash">
              <Hash value={record.headerHash} full copy />
            </Row>
            <Row label="Timestamp">
              {block.timestamp ? (
                <>
                  {formatDateTime(block.timestamp * 1000)} <span className="text-fg-faint">({formatAge(block.timestamp * 1000)})</span>
                </>
              ) : (
                <span className="text-fg-faint">Non-transaction blocks carry no timestamp</span>
              )}
            </Row>
            <Row label="Weight">
              <span className="tabular">{record.weight.toLocaleString("en-US")}</span>
            </Row>
            <Row label="Total iterations">
              <span className="tabular">{record.totalIters.toLocaleString("en-US")}</span>
            </Row>
            <Row label="Previous block">
              <Hash value={record.prevHash} href={routes.block(record.prevHash)} />
            </Row>
            <Row label="Farmer">
              <Hash value={farmer} href={routes.address(farmer)} head={12} tail={8} copy />
            </Row>
            <Row label="Pool">
              <Hash value={pool} href={routes.address(pool)} head={12} tail={8} copy />
            </Row>
            {isTx ? (
              <>
                <Row label="Cost used">
                  <div className="flex flex-col gap-1">
                    <span className="tabular">
                      {formatCost(block.cost)} of {formatCost(blockMaxCost)} ({formatPercent(fill, 1)})
                    </span>
                    <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill * 100)} aria-label="Block cost usage">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, fill * 100)}%` }} />
                    </div>
                  </div>
                </Row>
                <Row label="Total fees">
                  <span className="tabular">{formatAmount(block.fees)}</span>
                </Row>
                <Row label="Reward claims">
                  {block.rewardClaimsIncorporated.length === 0 ? (
                    <span className="text-fg-faint">None</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {block.rewardClaimsIncorporated.map((c, i) => {
                        const address = puzzleHashToAddress(c.puzzleHash, networkConfig.addressPrefix);
                        return (
                          <li key={`${c.parentCoinInfo}-${i}`} className="flex flex-wrap items-center gap-2">
                            <span className="tabular">{formatAmount(c.amount)}</span>
                            <span className="text-fg-faint">to</span>
                            <Hash value={address} href={routes.address(address)} head={10} tail={6} />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Row>
                <Row label="Generator" className="border-b-0">
                  {block.hasGenerator ? "Present (spend bundles included)" : <span className="text-fg-faint">Empty (rewards only)</span>}
                </Row>
              </>
            ) : (
              <Row label="Transactions" className="border-b-0">
                <div className="flex flex-col gap-2">
                  <p className="text-fg-muted">
                    This is a non-transaction block: it advances the chain's proof of space and time but carries no spends, fees or reward claims. Roughly two out of three Chia blocks are like this.
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link href={routes.block(record.prevTransactionBlockHeight)} className="rounded-sm border border-border px-3 py-1.5 hover:bg-surface-2">
                      ← Previous transaction block <span className="tabular text-accent">{formatNumber(record.prevTransactionBlockHeight)}</span>
                    </Link>
                    {nextTx.isLoading ? (
                      <Skeleton className="h-9 w-56" />
                    ) : nextTx.data ? (
                      <Link href={routes.block(nextTx.data.height)} className="rounded-sm border border-border px-3 py-1.5 hover:bg-surface-2">
                        Next transaction block <span className="tabular text-accent">{formatNumber(nextTx.data.height)}</span> →
                      </Link>
                    ) : (
                      <span className="rounded-sm border border-border px-3 py-1.5 text-fg-faint">No transaction block yet after this height</span>
                    )}
                  </div>
                </div>
              </Row>
            )}
          </dl>
        </CardBody>
      </Card>

      {isTx ? (
        <>
          <BlockTransactions height={record.height} headerHash={record.headerHash} blockCost={block.cost} blockMaxCost={blockMaxCost} isTransactionBlock={isTx} />
          <BlockCoins data={coins.data} loading={coins.isLoading} />
        </>
      ) : null}
    </div>
  );
}
