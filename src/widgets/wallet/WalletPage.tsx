"use client";

import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CHIA } from "@/shared/config/networks";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { formatAmount, formatCat, formatNumber, formatXch } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import {
  deriveAssets,
  fetchAssetBalance,
  fetchWalletCoinsPage,
  fetchWalletOverview,
  fetchWalletTransactionsPage,
  mergePages,
  type WalletAsset,
  type WalletAssetBalance,
  type WalletCoinRef,
  type WalletTx,
} from "@/shared/lib/sage/wallet";
import { useSageCapability } from "@/shared/lib/sage/useCapability";
import { useNftSensitivity } from "@/shared/lib/nft/useNftSensitivity";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { cn } from "@/shared/lib/cn";
import { useAsset } from "@/shared/api/useTokenList";
import { useT } from "@/shared/i18n/useT";
import { kindOf, WalletAmount } from "./amounts";
import { syncPercent } from "./SagePanels";
import {
  AssetIcon,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Hash,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import walletNs from "@/shared/i18n/messages/en/wallet";

const TX_PAGE = 25;
const COIN_PAGE = 50;

function TxRow({ tx, walletAddress }: { tx: WalletTx; walletAddress: string | null }) {
  const mine = (ref: WalletCoinRef) => ref.address === walletAddress || ref.address === null;
  const received = tx.created.filter(mine);
  const sent = tx.spent.filter(mine);
  const primary = received[0] ?? sent[0];
  const primaryToken = useAsset(primary && kindOf(primary) === "cat" ? primary.assetId : undefined);
  const primaryName = primaryToken?.name ?? primary?.assetName ?? null;
  const primarySensitivity = useNftSensitivity(
    primary && kindOf(primary) === "nft" ? primary.assetId : null
  );
  const t = useT(walletNs);
  const kind = t(
    received.length && !sent.length
      ? "direction.received"
      : sent.length && !received.length
        ? "direction.sent"
        : "direction.transaction"
  );
  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          received.length && !sent.length
            ? "bg-primary-soft"
            : sent.length && !received.length
              ? "bg-danger-soft"
              : "bg-surface-2"
        )}
      >
        {primary ? (
          <AssetIcon
            kind={kindOf(primary)}
            assetId={primary.assetId ?? undefined}
            iconUrl={primary.iconUrl}
            size={22}
            sensitivity={primarySensitivity}
          />
        ) : null}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {tx.pending ? t("txRow.pending", { kind }) : kind}
          {primaryName ? <span className="font-normal text-fg-muted"> · {primaryName}</span> : null}
        </span>
        <span className="text-xs text-fg-faint">
          {tx.height ? (
            <Link href={routes.block(tx.height)} className="hover:underline">
              {t("txRow.block", { height: formatNumber(tx.height) })}
            </Link>
          ) : (
            t("txRow.inMempool")
          )}
          {tx.timestamp ? ` · ${formatAge(tx.timestamp * 1000)}` : ""}
          {tx.id ? (
            <>
              {" · "}
              <Hash value={tx.id} href={routes.tx(tx.id)} head={6} tail={4} />
            </>
          ) : null}
        </span>
      </div>
      <span className="tabular ml-auto text-right">
        {received.slice(0, 2).map((r, i) => (
          <WalletAmount key={`r${i}`} refItem={r} sign="+" />
        ))}
        {sent.slice(0, 2).map((r, i) => (
          <WalletAmount key={`s${i}`} refItem={r} sign="−" />
        ))}
      </span>
    </li>
  );
}

/** Calls `onVisible` whenever the sentinel scrolls into view (lazy loading). */
function useSentinel(onVisible: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onVisible();
      },
      { rootMargin: "300px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible, enabled]);
  return ref;
}

function LoadMore({
  loaded,
  total,
  hasMore,
  loading,
  onMore,
  label,
}: {
  loaded: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  onMore: () => void;
  label: "transactions" | "coins";
}) {
  const t = useT(walletNs);
  const sentinel = useSentinel(onMore, hasMore && !loading);
  return (
    <div
      ref={sentinel}
      className="flex items-center justify-between gap-3 pt-3 text-xs text-fg-faint"
    >
      <span>
        {t(`loadMore.${label}`, { loaded: formatNumber(loaded), total: formatNumber(total) })}
      </span>
      {hasMore ? (
        <Button size="sm" onClick={onMore} disabled={loading}>
          {loading ? t("loadMore.loading") : t("loadMore.more")}
        </Button>
      ) : null}
    </div>
  );
}

/** Quiet prompt shown in a section whose capability was refused: one button, one more ask. */
function EnableNotice({
  capability,
  what,
}: {
  capability: string;
  what: "assetBalances" | "balanceAddress" | "history" | "coins";
}) {
  const t = useT(walletNs);
  const { refused, granted, enable } = useSageCapability(capability);
  if (granted || !refused) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border bg-bg px-3 py-2 text-xs text-fg-muted">
      <span>{t(`enable.${what}`)}</span>
      <Button size="sm" onClick={() => void enable()}>
        {t("enableInSage")}
      </Button>
    </div>
  );
}

type Tab = "assets" | "transactions" | "coins";

function Tabs({
  tab,
  onChange,
  counts,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  counts: Record<Tab, string>;
}) {
  const t = useT(walletNs);
  const items: Tab[] = ["assets", "transactions", "coins"];
  return (
    <div
      role="tablist"
      aria-label={t("tabs.label")}
      className="flex gap-1 rounded-full border border-border bg-bg p-1"
    >
      {items.map((id) => (
        <button
          key={id}
          role="tab"
          type="button"
          aria-selected={tab === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors",
            tab === id ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg"
          )}
        >
          {t(`tabs.${id}`)}
          <span className="tabular text-xs font-normal text-fg-faint">{counts[id]}</span>
        </button>
      ))}
    </div>
  );
}

function AssetTile({
  asset: a,
  balance: b,
}: {
  asset: WalletAsset;
  balance: WalletAssetBalance | null | undefined;
}) {
  const t = useT(walletNs);
  const token = useAsset(a.kind === "cat" ? a.assetId : undefined);
  // A held NFT is classified like any other before its thumbnail is shown (TASK-098).
  const sensitivity = useNftSensitivity(a.kind === "nft" ? a.assetId : null);
  const name =
    token?.name ??
    a.name ??
    token?.symbol ??
    a.ticker ??
    a.assetId?.slice(0, 12) ??
    a.kind.toUpperCase();
  const ticker = token?.symbol ?? a.ticker;
  const href =
    a.kind === "cat" && a.assetId
      ? routes.cat(a.assetId)
      : a.kind === "nft" && a.assetId
        ? routes.nft(launcherIdToNftId(a.assetId))
        : null;
  const balance =
    b === undefined
      ? "…"
      : b === null
        ? "—"
        : a.kind === "xch"
          ? formatAmount(b.confirmed)
          : a.kind === "cat"
            ? `${formatCat(b.confirmed)} ${ticker ?? "CAT"}`
            : t("asset.owned", { count: formatNumber(b.coins) });
  const body = (
    <div className="flex h-full items-center gap-3 rounded-card border border-border bg-bg px-3 py-3 transition-colors hover:border-border-strong">
      <AssetIcon
        kind={a.kind}
        assetId={a.assetId ?? undefined}
        iconUrl={a.iconUrl}
        size={34}
        sensitivity={sensitivity}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{name}</span>
        <span className="text-[11px] uppercase tracking-wide text-fg-faint">
          {a.kind}
          {ticker && ticker !== name ? ` · ${ticker}` : ""} ·{" "}
          {t("asset.txCount", { count: formatNumber(a.txCount) })}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="tabular font-semibold">{balance}</span>
        {b?.coins ? (
          <span className="tabular text-[11px] text-fg-faint">
            {t("asset.coins", { count: b.coins })}
          </span>
        ) : null}
      </div>
    </div>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="block h-full">
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

function AssetsCard({
  assets,
  loaded,
  total,
}: {
  assets: WalletAsset[];
  loaded: number;
  total: number;
}) {
  const t = useT(walletNs);
  const balances = useQueries({
    queries: assets.map((a) => ({
      queryKey: ["sageAssetBalance", a.kind, a.assetId ?? "xch"],
      queryFn: () => fetchAssetBalance(a.kind, a.assetId),
      staleTime: 30_000,
    })),
  });
  return (
    <Card>
      <CardHeader
        title={t("assets.title", { count: formatNumber(assets.length) })}
        action={
          loaded < total ? (
            <span className="text-xs text-fg-faint">
              {t("assets.partial", { loaded: formatNumber(loaded), total: formatNumber(total) })}
            </span>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-3">
        <EnableNotice capability="wallet.get_asset_balance" what="assetBalances" />
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((a, i) => (
            <AssetTile
              key={`${a.kind}:${a.assetId ?? "xch"}`}
              asset={a}
              balance={balances[i]?.data}
            />
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

/** Your own wallet, read straight from Sage (only inside Sage): recent first, the rest on scroll. */
export function WalletPage() {
  const t = useT(walletNs);
  const { inSage, walletAddress } = useSage();
  const { networkConfig } = useSettings();
  const [tab, setTab] = useState<Tab>("assets");
  const overview = useQuery({
    queryKey: ["sageWallet", networkConfig.id],
    queryFn: fetchWalletOverview,
    enabled: inSage,
    refetchInterval: 15_000,
  });
  const txs = useInfiniteQuery({
    queryKey: ["sageWalletTxs", networkConfig.id],
    enabled: inSage,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchWalletTransactionsPage(pageParam, TX_PAGE),
    getNextPageParam: (last) =>
      last.offset + last.items.length < last.total && last.items.length > 0
        ? last.offset + last.items.length
        : undefined,
  });
  const coins = useInfiniteQuery({
    queryKey: ["sageWalletCoins", networkConfig.id],
    enabled: inSage,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchWalletCoinsPage(pageParam, COIN_PAGE),
    getNextPageParam: (last) =>
      last.offset + last.items.length < last.total && last.items.length > 0
        ? last.offset + last.items.length
        : undefined,
  });
  const txItems = useMemo(() => (txs.data ? mergePages(txs.data.pages) : []), [txs.data]);
  const coinItems = useMemo(() => (coins.data ? mergePages(coins.data.pages) : []), [coins.data]);
  const txTotal = txs.data?.pages[0]?.total ?? 0;
  const coinTotal = coins.data?.pages[0]?.total ?? 0;
  const assets = useMemo(() => deriveAssets(txItems), [txItems]);
  const moreTxs = () => {
    if (txs.hasNextPage && !txs.isFetchingNextPage) void txs.fetchNextPage();
  };
  const moreCoins = () => {
    if (coins.hasNextPage && !coins.isFetchingNextPage) void coins.fetchNextPage();
  };

  if (!inSage) {
    return (
      <EmptyState
        title={t("page.outsideTitle")}
        description={t("page.outsideDescription")}
        action={
          <Link href={routes.home()} className="text-accent hover:underline">
            {t("page.backToDashboard")}
          </Link>
        }
      />
    );
  }
  const w = overview.data;
  const address = w?.receiveAddress ?? walletAddress;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Wallet size={20} className="text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-primary">
          {t("page.fromSage")}
        </span>
      </div>
      <p className="text-xs text-fg-faint">
        {t("page.intro", { network: networkConfig.label })}
        {address ? (
          <>
            {" "}
            {t.rich("page.openAddress", {
              link: (c) => (
                <Link href={routes.address(address)} className="text-accent hover:underline">
                  {c}
                </Link>
              ),
            })}
          </>
        ) : null}
      </p>
      {overview.isLoading && !w ? (
        <Skeleton className="h-24 w-full" />
      ) : !w ? (
        <EmptyState
          tone="danger"
          title={t("page.noAnswerTitle")}
          description={t("page.noAnswerDescription")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatTile
              label={t("stats.balance")}
              value={`${formatXch(w.balance, 6)} ${w.ticker}`}
              tone="primary"
              sub={w.balance >= CHIA.MOJOS_PER_XCH ? undefined : `${w.balance.toString()} mojo`}
            />
            <StatTile
              label={t("stats.sync")}
              value={syncPercent(w.syncedCoins, w.totalCoins)}
              sub={t("stats.syncedCoins", {
                synced: formatNumber(w.syncedCoins),
                total: formatNumber(w.totalCoins),
              })}
            />
            <StatTile
              label={t("stats.pending")}
              value={formatNumber(w.pending.length)}
              sub={t("stats.inFlight")}
              tone={w.pending.length ? "warning" : "default"}
            />
            <StatTile
              label={t("stats.history")}
              value={txTotal ? formatNumber(txTotal) : "…"}
              sub={t("stats.historySub", { coins: coinTotal ? formatNumber(coinTotal) : "…" })}
            />
          </div>
          {address ? (
            <Card>
              <CardHeader title={t("page.receiveAddress")} />
              <CardBody>
                <Hash
                  value={address}
                  href={routes.address(address)}
                  full
                  copy
                  className="text-sm"
                />
              </CardBody>
            </Card>
          ) : null}
          <EnableNotice capability="wallet.get_sync_status" what="balanceAddress" />
          {w.pending.length > 0 ? (
            <Card className="border-warning/40">
              <CardHeader title={t("page.pendingTitle", { count: w.pending.length })} />
              <CardBody>
                <ul className="divide-y divide-border/60">
                  {w.pending.map((tx, i) => (
                    <TxRow key={tx.id ?? i} tx={tx} walletAddress={address} />
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
          <Tabs
            tab={tab}
            onChange={setTab}
            counts={{
              assets: formatNumber(assets.length),
              transactions: txTotal ? formatNumber(txTotal) : "…",
              coins: coinTotal ? formatNumber(coinTotal) : "…",
            }}
          />
          {tab === "assets" ? (
            <AssetsCard assets={assets} loaded={txItems.length} total={txTotal} />
          ) : null}
          <Card className={tab === "transactions" ? "" : "hidden"}>
            <CardHeader
              title={t("page.transactions")}
              action={<span className="text-xs text-fg-faint">{t("page.newestFirst")}</span>}
            />
            <CardBody>
              <EnableNotice capability="wallet.get_transactions" what="history" />
              {txs.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : txItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-faint">{t("page.noTransactions")}</p>
              ) : (
                <>
                  <ul className="divide-y divide-border/60">
                    {txItems.map((tx, i) => (
                      <TxRow key={`${tx.height ?? "p"}-${i}`} tx={tx} walletAddress={address} />
                    ))}
                  </ul>
                  <LoadMore
                    loaded={txItems.length}
                    total={txTotal}
                    hasMore={!!txs.hasNextPage}
                    loading={txs.isFetchingNextPage}
                    onMore={moreTxs}
                    label="transactions"
                  />
                </>
              )}
            </CardBody>
          </Card>
          <Card className={tab === "coins" ? "" : "hidden"}>
            <CardHeader
              title={t("page.coins")}
              action={<span className="text-xs text-fg-faint">{t("page.unspentNewestFirst")}</span>}
            />
            <CardBody>
              <EnableNotice capability="wallet.get_coins" what="coins" />
              {coins.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : coinItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-faint">{t("page.noCoins")}</p>
              ) : (
                <>
                  <Table>
                    <thead>
                      <tr>
                        <Th>{t("page.colCoin")}</Th>
                        <Th>{t("page.colAddress")}</Th>
                        <Th className="text-right">{t("page.colAmount")}</Th>
                        <Th className="text-right">{t("page.colCreated")}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {coinItems.map((c) => (
                        <Tr key={c.coinId}>
                          <Td>
                            <Hash value={c.coinId} href={routes.coin(c.coinId)} head={8} tail={6} />
                          </Td>
                          <Td>
                            <Hash
                              value={c.address}
                              href={routes.address(c.address)}
                              head={8}
                              tail={5}
                            />
                          </Td>
                          <Td className="tabular text-right">{formatAmount(c.amount)}</Td>
                          <Td className="tabular text-right text-fg-faint">
                            {c.createdHeight ? formatNumber(c.createdHeight) : "—"}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                  <LoadMore
                    loaded={coinItems.length}
                    total={coinTotal}
                    hasMore={!!coins.hasNextPage}
                    loading={coins.isFetchingNextPage}
                    onMore={moreCoins}
                    label="coins"
                  />
                </>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
