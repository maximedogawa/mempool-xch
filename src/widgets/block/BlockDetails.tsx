"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBlockchainState } from "@/shared/api/hooks";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatCost, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { useT } from "@/shared/i18n/useT";
import { formatInteger } from "@/shared/i18n/number";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { isNotFound } from "@/shared/lib/rpc/errors";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Badge, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton } from "@/shared/ui";
import { blockReward } from "@/shared/lib/blocks/reward";
import { useBlockPool } from "@/shared/lib/pools/usePoolLookup";
import { BlockCoinFlow } from "./BlockCoinFlow";
import { BlockCoins } from "./BlockCoins";
import { BlockTransactions } from "./BlockTransactions";
import { AssetsMoved } from "./AssetsMoved";
import {
  parseBlockId,
  useBlockRecord,
  useFullBlock,
  useBlockAssetTotals,
  useBlockCoins,
  useNextTransactionBlock,
} from "./useBlock";
import blockNs from "@/shared/i18n/messages/en/block";

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-1 border-b border-border/60 py-2 text-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-3",
        className
      )}
    >
      <dt className="text-xs font-medium uppercase tracking-wider text-fg-muted sm:pt-0.5">
        {label}
      </dt>
      <dd className="min-w-0 break-all">{children}</dd>
    </div>
  );
}

export function BlockDetails({ id }: { id: string }) {
  const t = useT(blockNs);
  const { networkConfig } = useSettings();
  const parsed = parseBlockId(id);
  const query = useBlockRecord(id);
  const state = useBlockchainState();
  const peakHeight = useLiveValue("peakHeight");
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  const blockMaxCost = state.data?.blockMaxCost ?? 11_000_000_000;
  const record = query.data;
  const farmedBy = useBlockPool(record);
  const block = useFullBlock(record?.headerHash ?? null).data;
  const isTx = record?.isTransactionBlock ?? false;
  const coins = useBlockCoins(record?.headerHash ?? null, isTx);
  const nextTx = useNextTransactionBlock(record?.height ?? null, record !== undefined && !isTx);
  const totals = useBlockAssetTotals(record?.height ?? null, record?.headerHash ?? null, isTx);

  if (!parsed) {
    return (
      <EmptyState
        tone="danger"
        title={t("details.invalidTitle")}
        description={t("details.invalidDescription")}
      />
    );
  }
  if (query.error) {
    return isNotFound(query.error) ? (
      <EmptyState
        title={t("details.notFoundTitle")}
        description={t("details.notFoundDescription", { id, network: networkConfig.label })}
      />
    ) : (
      <EmptyState
        tone="danger"
        title={t("details.loadError")}
        description={String((query.error as Error).message)}
      />
    );
  }
  if (!record) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-[320px] w-full" />
      </div>
    );
  }

  const fill = (block?.cost ?? 0) / blockMaxCost;
  const farmer = puzzleHashToAddress(record.farmerPuzzleHash, networkConfig.addressPrefix);
  const pool = puzzleHashToAddress(record.poolPuzzleHash, networkConfig.addressPrefix);
  const nextDisabled = peak !== null && record.height >= peak;
  const poolEntry = farmedBy.entry;
  const claimTarget = farmedBy.claim?.target
    ? puzzleHashToAddress(farmedBy.claim.target, networkConfig.addressPrefix)
    : null;
  const reward = blockReward(record.height);
  const rewardClaims = record.rewardClaimsIncorporated ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold">
          <span>
            {t.rich("details.heading", {
              height: () => <span className="tabular">{formatNumber(record.height)}</span>,
            })}
          </span>
          {isTx ? (
            <Badge tone="primary">{t("details.transactionBlock")}</Badge>
          ) : (
            <Badge tone="neutral">{t("details.noTransactions")}</Badge>
          )}
          {peak !== null && record.height === peak ? (
            <Badge tone="info">{t("details.peak")}</Badge>
          ) : null}
        </h1>
        <nav aria-label={t("details.navigation")} className="flex gap-2">
          <Link
            href={routes.block(Math.max(0, record.height - 1))}
            aria-disabled={record.height === 0}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-sm border border-border px-3 text-sm hover:bg-surface-2",
              record.height === 0 && "pointer-events-none opacity-50"
            )}
          >
            <ChevronLeft size={16} aria-hidden="true" /> {t("details.previous")}
          </Link>
          <Link
            href={routes.block(record.height + 1)}
            aria-disabled={nextDisabled}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-sm border border-border px-3 text-sm hover:bg-surface-2",
              nextDisabled && "pointer-events-none opacity-50"
            )}
          >
            {t("details.next")} <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      </div>

      {isTx ? <AssetsMoved totals={totals.data} loading={totals.isLoading} /> : null}

      <Card>
        <CardHeader title={t("details.title")} />
        <CardBody>
          <dl>
            <Row label={t("details.headerHash")}>
              <Hash value={record.headerHash} full copy />
            </Row>
            <Row label={t("details.timestamp")}>
              {record.timestamp ? (
                <>
                  {formatDateTime(record.timestamp * 1000)}{" "}
                  <span className="text-fg-faint">({formatAge(record.timestamp * 1000)})</span>
                </>
              ) : (
                <span className="text-fg-faint">{t("details.noTimestamp")}</span>
              )}
            </Row>
            <Row label={t("details.weight")}>
              <span className="tabular">{formatInteger(record.weight)}</span>
            </Row>
            <Row label={t("details.totalIters")}>
              <span className="tabular">{formatInteger(record.totalIters)}</span>
            </Row>
            <Row label={t("details.signagePoint")}>
              <span className="tabular">
                {t("details.signagePointValue", { index: record.signagePointIndex })}
              </span>
              {record.overflow ? (
                <span className="text-fg-faint"> {t("details.overflow")}</span>
              ) : null}
            </Row>
            <Row label={t("details.deficit")}>
              <span className="tabular">{record.deficit}</span>
            </Row>
            <Row label={t("details.subEpochSummary")}>
              {record.subEpochSummaryIncluded ? t("details.yes") : t("details.no")}
            </Row>
            <Row label={t("details.previousBlock")}>
              <Hash value={record.prevHash} href={routes.block(record.prevHash)} />
            </Row>
            <Row label={t("details.previousTxBlock")}>
              <Link
                href={routes.block(record.prevTransactionBlockHeight)}
                className="tabular text-accent hover:underline"
              >
                {formatNumber(record.prevTransactionBlockHeight)}
              </Link>
            </Row>
            <Row label={t("details.farmedBy")}>
              <div className="flex flex-col gap-1">
                <span data-testid="farmed-by">
                  {poolEntry ? (
                    <a
                      href={poolEntry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      {poolEntry.name}
                    </a>
                  ) : claimTarget ? (
                    <span className="text-fg-muted">
                      {t.rich(
                        farmedBy.claim?.selfPooled
                          ? "details.selfPooledClaim"
                          : "details.unnamedPoolClaim",
                        {
                          address: () => (
                            <Hash
                              value={claimTarget}
                              href={routes.address(claimTarget)}
                              head={8}
                              tail={6}
                            />
                          ),
                        }
                      )}
                    </span>
                  ) : farmedBy.bothShares ? (
                    <span className="text-fg-muted">{t("details.sameAddress")}</span>
                  ) : (
                    <span className="text-fg-muted">{t("details.unclaimed")}</span>
                  )}
                </span>
                <span className="text-xs text-fg-faint">
                  {t.rich("details.poolPayout", {
                    address: () => (
                      <Hash value={pool} href={routes.address(pool)} head={12} tail={8} copy />
                    ),
                  })}
                </span>
              </div>
            </Row>
            <Row label={t("details.farmerAddress")}>
              <Hash value={farmer} href={routes.address(farmer)} head={12} tail={8} copy />
            </Row>
            <Row label={t("details.blockReward")}>
              <span className="tabular">{formatAmount(reward.total)}</span>{" "}
              <span className="text-fg-faint">
                {t(isTx ? "details.rewardSplitTx" : "details.rewardSplit", {
                  pool: formatAmount(reward.pool),
                  farmer: formatAmount(reward.farmer),
                })}
              </span>
            </Row>
            {isTx ? (
              <>
                <Row label={t("details.costUsed")}>
                  <div className="flex flex-col gap-1">
                    <span className="tabular">
                      {t("details.costOf", {
                        used: block ? formatCost(block.cost) : "…",
                        max: formatCost(blockMaxCost),
                      })}
                      {block ? ` (${formatPercent(fill, 1)})` : ""}
                    </span>
                    <div
                      className="h-2 w-full max-w-md overflow-hidden rounded-full bg-surface-2"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(fill * 100)}
                      aria-label={t("details.costUsage")}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, fill * 100)}%` }}
                      />
                    </div>
                  </div>
                </Row>
                <Row label={t("details.contents")}>
                  {coins.data ? (
                    <span className="tabular" data-testid="block-contents">
                      {t("details.contentsValue", {
                        spends: t("details.contentsSpends", {
                          count: coins.data.removals.length,
                        }),
                        coins: t("details.contentsCoins", { count: coins.data.additions.length }),
                      })}
                    </span>
                  ) : coins.isLoading ? (
                    <Skeleton className="h-5 w-40" />
                  ) : (
                    <span className="text-fg-faint">{t("details.unavailable")}</span>
                  )}
                </Row>
                <Row label={t("details.totalFees")}>
                  <span className="tabular">{formatAmount(record.fees ?? 0n)}</span>
                </Row>
                <Row label={t("details.rewardClaims")}>
                  {rewardClaims.length === 0 ? (
                    <span className="text-fg-faint">{t("none")}</span>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {rewardClaims.map((c, i) => {
                        const address = puzzleHashToAddress(
                          c.puzzleHash,
                          networkConfig.addressPrefix
                        );
                        return (
                          <li
                            key={`${c.parentCoinInfo}-${i}`}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span className="tabular">{formatAmount(c.amount)}</span>
                            <span className="text-fg-faint">{t("details.to")}</span>
                            <Hash
                              value={address}
                              href={routes.address(address)}
                              head={10}
                              tail={6}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Row>
                <Row label={t("details.generator")} className="border-b-0">
                  {!block ? (
                    <Skeleton className="h-4 w-24" />
                  ) : block.hasGenerator ? (
                    <div className="flex flex-col gap-1">
                      <span>{t("details.present")}</span>
                      <span className="break-normal text-xs text-fg-faint">
                        {t("details.generatorExplained")}
                      </span>
                    </div>
                  ) : (
                    <span className="text-fg-faint">{t("details.generatorEmpty")}</span>
                  )}
                </Row>
              </>
            ) : (
              <Row label={t("details.transactions")} className="border-b-0">
                <div className="flex flex-col gap-2">
                  <p className="text-fg-muted">{t("details.nonTxExplained")}</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Link
                      href={routes.block(record.prevTransactionBlockHeight)}
                      className="rounded-sm border border-border px-3 py-1.5 hover:bg-surface-2"
                    >
                      {t.rich("details.previousTxLink", {
                        height: () => (
                          <span className="tabular text-accent">
                            {formatNumber(record.prevTransactionBlockHeight)}
                          </span>
                        ),
                      })}
                    </Link>
                    {nextTx.isLoading ? (
                      <Skeleton className="h-9 w-56" />
                    ) : nextTx.data ? (
                      <Link
                        href={routes.block(nextTx.data.height)}
                        className="rounded-sm border border-border px-3 py-1.5 hover:bg-surface-2"
                      >
                        {t.rich("details.nextTxLink", {
                          height: () => (
                            <span className="tabular text-accent">
                              {formatNumber(nextTx.data!.height)}
                            </span>
                          ),
                        })}
                      </Link>
                    ) : (
                      <span className="rounded-sm border border-border px-3 py-1.5 text-fg-faint">
                        {t("details.noNextTx")}
                      </span>
                    )}
                  </div>
                </div>
              </Row>
            )}
          </dl>
        </CardBody>
      </Card>

      {isTx && block ? (
        <>
          <BlockTransactions
            height={record.height}
            headerHash={record.headerHash}
            blockCost={block.cost}
            blockMaxCost={blockMaxCost}
            isTransactionBlock={isTx}
          />
          <BlockCoinFlow data={coins.data} loading={coins.isLoading} />
          <BlockCoins data={coins.data} loading={coins.isLoading} />
        </>
      ) : null}
    </div>
  );
}
