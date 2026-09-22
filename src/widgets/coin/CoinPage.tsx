"use client";

import Link from "next/link";
import { puzzleHashToAddress, launcherIdToNftId } from "@/shared/lib/chia/address";
import {
  feePerCost,
  formatAmount,
  formatCat,
  formatCost,
  formatFeeRate,
  formatNumber,
} from "@/shared/lib/chia/amounts";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { errorMessage, isNotFound } from "@/shared/lib/rpc/errors";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CatRef,
  EmptyState,
  Hash,
  KindBadge,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { readSemantics } from "./semantics";
import { useCoinChildren, useCoinDetails, useCoinMempoolSpends, useCoinRecord } from "./useCoin";
import { SageCoinPanel } from "@/widgets/wallet/SagePanels";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-44 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        {label}
      </dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

export function CoinPage({ id }: { id: string | null }) {
  const t = useT("coin");
  const { endpoints, networkConfig } = useSettings();
  const record = useCoinRecord(id);
  const details = useCoinDetails(id);
  const children = useCoinChildren(id);
  const unspent = record.data ? !record.data.spent : false;
  const pending = useCoinMempoolSpends(id, unspent);

  if (!id) return <EmptyState title={t("noId.title")} description={t("noId.description")} />;
  if (record.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (record.error && isNotFound(record.error)) {
    return (
      <div className="flex flex-col gap-4">
        <Heading id={id} />
        <EmptyState title={t("notFound.title")} description={t("notFound.description")} />
      </div>
    );
  }
  if (record.error || !record.data) {
    return (
      <EmptyState
        tone="danger"
        title={t("loadError")}
        description={errorMessage(record.error)}
        action={<Button onClick={() => record.refetch()}>{t("retry")}</Button>}
      />
    );
  }

  const coin = record.data;
  const semantics =
    readSemantics(details.data?.details?.semantics ?? null) ??
    (details.data?.ref
      ? readSemantics({
          coin_id: id,
          outer_puzzle_type: details.data.ref.outerPuzzleType,
          asset_id: details.data.ref.assetId,
        })
      : null);
  const links = details.data?.links ?? null;
  const owner = semantics?.custodyP2 ?? coin.coin.puzzleHash;
  const address = safeAddress(owner, networkConfig.addressPrefix);
  const puzzleAddress = safeAddress(coin.coin.puzzleHash, networkConfig.addressPrefix);
  const kind = semantics?.kind ?? "unknown";
  const amount =
    kind === "cat" ? `${formatCat(coin.coin.amount)} CAT` : formatAmount(coin.coin.amount);

  return (
    <div className="flex flex-col gap-4">
      <Heading id={id} badge={semantics ? <KindBadge kind={kind} /> : null} spent={coin.spent} />
      <SageCoinPanel coinId={id} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile
          label={t("stats.amount")}
          value={amount}
          sub={`${coin.coin.amount.toString()} mojo`}
          tone="primary"
        />
        <StatTile
          label={t("stats.created")}
          value={
            <Link
              href={routes.block(coin.confirmedBlockIndex)}
              className="text-accent hover:underline"
            >
              {formatNumber(coin.confirmedBlockIndex)}
            </Link>
          }
          sub={
            coin.timestamp
              ? `${formatAge(coin.timestamp * 1000)} · ${formatDateTime(coin.timestamp * 1000)}`
              : undefined
          }
        />
        <StatTile
          label={t("stats.spent")}
          value={
            coin.spent ? (
              <Link
                href={routes.block(coin.spentBlockIndex)}
                className="text-accent hover:underline"
              >
                {formatNumber(coin.spentBlockIndex)}
              </Link>
            ) : (
              t("unspent")
            )
          }
          sub={
            coin.spent
              ? t("stats.blockHeight")
              : pending.data && pending.data.length > 0
                ? t("stats.spendPending")
                : t("stats.noPendingSpend")
          }
          tone={
            coin.spent ? "default" : pending.data && pending.data.length > 0 ? "warning" : "primary"
          }
        />
        <StatTile
          label={t("stats.origin")}
          value={coin.coinbase ? t("stats.reward") : t("stats.spend")}
          sub={coin.coinbase ? t("stats.rewardSub") : t("stats.spendSub")}
        />
      </div>

      <Card>
        <CardHeader title={t("record.title")} />
        <CardBody>
          <dl className="divide-y divide-border/60">
            <Row label={t("record.coinId")}>
              <Hash value={coin.name} full copy />
            </Row>
            <Row label={t("record.parentCoin")}>
              {coin.coinbase ? (
                <span className="inline-flex items-center gap-2">
                  <Hash value={coin.coin.parentCoinInfo} full copy />{" "}
                  <span className="text-xs text-fg-faint">{t("record.noParent")}</span>
                </span>
              ) : (
                <Hash
                  value={coin.coin.parentCoinInfo}
                  href={routes.coin(coin.coin.parentCoinInfo)}
                  full
                  copy
                />
              )}
            </Row>
            <Row label={t("record.puzzleHash")}>
              <Hash value={coin.coin.puzzleHash} full copy />
            </Row>
            <Row label={t("record.address")}>
              {puzzleAddress ? (
                <Hash value={puzzleAddress} href={routes.address(puzzleAddress)} full copy />
              ) : (
                <span className="text-fg-faint">—</span>
              )}
              {semantics?.custodyP2 && semantics.custodyP2 !== coin.coin.puzzleHash && address ? (
                <span className="mt-1 block text-xs text-fg-faint">
                  {t.rich("record.owner", {
                    address: () => (
                      <Hash
                        value={address}
                        href={routes.address(address)}
                        head={10}
                        tail={6}
                        copy
                      />
                    ),
                  })}
                </span>
              ) : null}
            </Row>
            <Row label={t("record.creatingTx")}>
              {links?.createdInTxId ? (
                <Hash value={links.createdInTxId} href={routes.tx(links.createdInTxId)} full />
              ) : (
                <span className="text-fg-faint">
                  {coin.coinbase
                    ? t("record.rewardCoin")
                    : endpoints.isCoinset
                      ? details.isLoading
                        ? "…"
                        : t("record.notAvailable")
                      : t("record.needsCoinset")}{" "}
                  ·{" "}
                  <Link
                    href={routes.block(coin.confirmedBlockIndex)}
                    className="text-accent hover:underline"
                  >
                    {t("record.block", { height: formatNumber(coin.confirmedBlockIndex) })}
                  </Link>
                </span>
              )}
            </Row>
            <Row label={t("record.spendingTx")}>
              {coin.spent ? (
                links?.spentInTxId ? (
                  <Hash value={links.spentInTxId} href={routes.tx(links.spentInTxId)} full />
                ) : (
                  <span className="text-fg-faint">
                    {endpoints.isCoinset
                      ? details.isLoading
                        ? "…"
                        : t("record.notAvailable")
                      : t("record.needsCoinset")}{" "}
                    ·{" "}
                    <Link
                      href={routes.block(coin.spentBlockIndex)}
                      className="text-accent hover:underline"
                    >
                      {t("record.block", { height: formatNumber(coin.spentBlockIndex) })}
                    </Link>
                  </span>
                )
              ) : (
                <span className="text-fg-faint">{t("record.unspent")}</span>
              )}
            </Row>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("type.title")} />
        <CardBody>
          {!endpoints.isCoinset ? (
            <p className="text-sm text-fg-faint">{t("type.needsCoinset")}</p>
          ) : details.isLoading ? (
            <Skeleton className="h-10" />
          ) : semantics ? (
            <dl className="divide-y divide-border/60">
              <Row label={t("type.kind")}>
                <span className="inline-flex items-center gap-2">
                  <KindBadge kind={kind} />
                  <span className="text-fg-muted">{semantics.outerPuzzleType}</span>
                  {semantics.classification ? (
                    <Badge tone="neutral">{semantics.classification}</Badge>
                  ) : null}
                </span>
              </Row>
              {semantics.custodyPuzzleType ? (
                <Row label={t("type.custodyPuzzle")}>{semantics.custodyPuzzleType}</Row>
              ) : null}
              {semantics.assetId ? (
                <Row
                  label={
                    kind === "cat"
                      ? t("type.catAssetId")
                      : kind === "nft"
                        ? t("type.nft")
                        : t("type.launcherId")
                  }
                >
                  {kind === "cat" ? (
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <CatRef assetId={semantics.assetId} size={20} />
                      <Hash
                        value={semantics.assetId}
                        href={routes.cat(semantics.assetId)}
                        full
                        copy
                      />
                    </span>
                  ) : kind === "nft" ? (
                    <Hash
                      value={launcherIdToNftId(semantics.assetId)}
                      href={routes.nft(launcherIdToNftId(semantics.assetId))}
                      full
                      copy
                    />
                  ) : (
                    <Hash value={semantics.assetId} full copy />
                  )}
                </Row>
              ) : null}
              {semantics.rest.map(([k, v]) => (
                <Row key={k} label={k.replace(/_/g, " ")}>
                  <span className="mono break-all">{v}</span>
                </Row>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-fg-faint">{t("type.notClassified")}</p>
          )}
        </CardBody>
      </Card>

      {!coin.spent ? (
        <Card>
          <CardHeader title={t("pending.title")} />
          <CardBody>
            {pending.isLoading ? (
              <Skeleton className="h-10" />
            ) : !pending.data || pending.data.length === 0 ? (
              <p className="text-sm text-fg-faint">{t("pending.none")}</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>{t("pending.spendBundle")}</Th>
                    <Th className="text-right">{t("pending.fee")}</Th>
                    <Th className="text-right">{t("pending.cost")}</Th>
                    <Th className="text-right">{t("pending.feePerCost")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {pending.data.map((item) => (
                    <Tr key={item.name}>
                      <Td>
                        <Hash value={item.name} href={routes.tx(item.name)} head={10} tail={6} />
                      </Td>
                      <Td className="tabular text-right">{formatAmount(item.fee)}</Td>
                      <Td className="tabular text-right">{formatCost(item.cost)}</Td>
                      <Td className="tabular text-right">
                        {formatFeeRate(feePerCost(item.fee, item.cost))}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title={
            children.data
              ? t("children.titleCount", { count: children.data.length })
              : t("children.title")
          }
        />
        <CardBody>
          {children.isLoading ? (
            <Skeleton className="h-10" />
          ) : !children.data || children.data.length === 0 ? (
            <p className="text-sm text-fg-faint">
              {coin.spent ? t("children.noneSpent") : t("children.noneUnspent")}
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("children.coinId")}</Th>
                  <Th>{t("children.address")}</Th>
                  <Th className="text-right">{t("children.amount")}</Th>
                  <Th className="text-right">{t("children.status")}</Th>
                </tr>
              </thead>
              <tbody>
                {children.data.map((c) => {
                  const addr = safeAddress(c.coin.puzzleHash, networkConfig.addressPrefix);
                  return (
                    <Tr key={c.name}>
                      <Td>
                        <Hash value={c.name} href={routes.coin(c.name)} head={10} tail={6} />
                      </Td>
                      <Td>
                        {addr ? (
                          <Hash value={addr} href={routes.address(addr)} head={8} tail={5} />
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="tabular text-right">{formatAmount(c.coin.amount)}</Td>
                      <Td className="text-right">
                        {c.spent ? (
                          <Link
                            href={routes.block(c.spentBlockIndex)}
                            className="text-xs text-fg-muted hover:underline"
                          >
                            {t("children.spentAt", { height: formatNumber(c.spentBlockIndex) })}
                          </Link>
                        ) : (
                          <span className="text-xs text-primary">{t("children.unspent")}</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function safeAddress(puzzleHash: string, prefix: "xch" | "txch"): string | null {
  try {
    return puzzleHashToAddress(puzzleHash, prefix);
  } catch {
    return null;
  }
}

function Heading({ id, badge, spent }: { id: string; badge?: React.ReactNode; spent?: boolean }) {
  const t = useT("coin");
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{t("heading")}</h1>
        {spent === undefined ? null : spent ? (
          <Badge tone="neutral">{t("spent")}</Badge>
        ) : (
          <Badge tone="primary">{t("unspent")}</Badge>
        )}
        {badge}
      </div>
      <Hash value={id} full copy className="text-sm text-fg-muted" />
    </header>
  );
}
