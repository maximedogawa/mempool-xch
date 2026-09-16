"use client";

import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
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
  WALLET_CAPABILITIES,
  type WalletAsset,
  type WalletCoinRef,
  type WalletTx,
} from "@/shared/lib/sage/wallet";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetIcon, Button, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton, StatTile, Table, Td, Th, Tr } from "@/shared/ui";

const TX_PAGE = 25;
const COIN_PAGE = 50;

function kindOf(ref: WalletCoinRef): "xch" | "cat" | "nft" | "did" | "unknown" {
  const k = ref.assetKind.toLowerCase();
  if (k.includes("nft")) return "nft";
  if (k.includes("did")) return "did";
  if (k.includes("cat") || k.includes("token")) return "cat";
  if (k.includes("xch") || (!ref.assetId && k !== "unknown")) return "xch";
  return ref.assetId ? "cat" : "xch";
}

function amountOf(ref: WalletCoinRef): string {
  const kind = kindOf(ref);
  if (kind === "xch") return formatAmount(ref.amount);
  if (kind === "nft" || kind === "did") return "1";
  const p = BigInt(10) ** BigInt(ref.precision);
  const whole = ref.amount / p;
  const frac = (ref.amount % p).toString().padStart(ref.precision, "0").replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${frac ? `.${frac}` : ""} ${ref.ticker ?? "CAT"}`;
}

function TxRow({ tx, walletAddress }: { tx: WalletTx; walletAddress: string | null }) {
  const mine = (ref: WalletCoinRef) => ref.address === walletAddress || ref.address === null;
  const received = tx.created.filter(mine);
  const sent = tx.spent.filter(mine);
  const primary = received[0] ?? sent[0];
  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      {primary ? <AssetIcon kind={kindOf(primary)} assetId={primary.assetId ?? undefined} /> : null}
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">
          {tx.pending ? "Pending · " : ""}
          {received.length && !sent.length ? "Received" : sent.length && !received.length ? "Sent" : "Transaction"}
        </span>
        <span className="text-xs text-fg-faint">
          {tx.height ? (
            <Link href={routes.block(tx.height)} className="hover:underline">
              block {formatNumber(tx.height)}
            </Link>
          ) : (
            "in the mempool"
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
          <span key={`r${i}`} className="block text-primary">
            +{amountOf(r)}
          </span>
        ))}
        {sent.slice(0, 2).map((r, i) => (
          <span key={`s${i}`} className="block text-danger">
            −{amountOf(r)}
          </span>
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
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onVisible();
    }, { rootMargin: "300px" });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible, enabled]);
  return ref;
}

function LoadMore({ loaded, total, hasMore, loading, onMore, label }: { loaded: number; total: number; hasMore: boolean; loading: boolean; onMore: () => void; label: string }) {
  const sentinel = useSentinel(onMore, hasMore && !loading);
  return (
    <div ref={sentinel} className="flex items-center justify-between gap-3 pt-3 text-xs text-fg-faint">
      <span>
        {formatNumber(loaded)} of {formatNumber(total)} {label}
      </span>
      {hasMore ? (
        <Button size="sm" onClick={onMore} disabled={loading}>
          {loading ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}

function AssetsCard({ assets, loaded, total }: { assets: WalletAsset[]; loaded: number; total: number }) {
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
        title={`Assets · ${formatNumber(assets.length)}`}
        action={loaded < total ? <span className="text-xs text-fg-faint">from the first {formatNumber(loaded)} of {formatNumber(total)} transactions</span> : null}
      />
      <CardBody>
        <ul className="divide-y divide-border/60">
          {assets.map((a, i) => {
            const b = balances[i]?.data;
            const href = a.kind === "cat" && a.assetId ? routes.cat(a.assetId) : a.kind === "nft" && a.assetId ? routes.nft(launcherIdToNftId(a.assetId)) : null;
            const balance =
              b === undefined ? "…" : b === null ? "n/a" : a.kind === "xch" ? formatAmount(b.confirmed) : a.kind === "cat" ? `${formatCat(b.confirmed)} ${a.ticker ?? "CAT"}` : formatNumber(b.coins);
            return (
              <li key={`${a.kind}:${a.assetId ?? "xch"}`} className="flex items-center gap-3 py-2 text-sm">
                <AssetIcon kind={a.kind} assetId={a.assetId ?? undefined} size={22} />
                <div className="flex min-w-0 flex-col">
                  {href ? (
                    <Link href={href} className="truncate font-medium hover:underline">
                      {a.name ?? a.ticker ?? a.assetId?.slice(0, 12) ?? a.kind.toUpperCase()}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{a.name ?? a.ticker ?? a.kind.toUpperCase()}</span>
                  )}
                  <span className="text-xs text-fg-faint">
                    {a.kind.toUpperCase()} · {formatNumber(a.txCount)} transaction{a.txCount === 1 ? "" : "s"}
                    {b?.coins ? ` · ${formatNumber(b.coins)} spendable coin${b.coins === 1 ? "" : "s"}` : ""}
                  </span>
                </div>
                <span className="tabular ml-auto text-right font-medium">{balance}</span>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}

/** Your own wallet, read straight from Sage (only inside Sage): recent first, the rest on scroll. */
export function WalletPage() {
  const { inSage, walletAddress } = useSage();
  const { networkConfig } = useSettings();
  const overview = useQuery({ queryKey: ["sageWallet", networkConfig.id], queryFn: fetchWalletOverview, enabled: inSage, refetchInterval: 15_000 });
  const txs = useInfiniteQuery({
    queryKey: ["sageWalletTxs", networkConfig.id],
    enabled: inSage,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchWalletTransactionsPage(pageParam, TX_PAGE),
    getNextPageParam: (last) => (last.offset + last.items.length < last.total && last.items.length > 0 ? last.offset + last.items.length : undefined),
  });
  const coins = useInfiniteQuery({
    queryKey: ["sageWalletCoins", networkConfig.id],
    enabled: inSage,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchWalletCoinsPage(pageParam, COIN_PAGE),
    getNextPageParam: (last) => (last.offset + last.items.length < last.total && last.items.length > 0 ? last.offset + last.items.length : undefined),
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
        title="Open mempoolxch.space inside the Sage wallet"
        description="This page reads balances, pending transactions, assets and coins directly from your wallet. In a browser, search for your address instead."
        action={
          <Link href={routes.home()} className="text-accent hover:underline">
            Back to the dashboard
          </Link>
        }
      />
    );
  }
  const w = overview.data;
  const address = w?.receiveAddress ?? walletAddress;
  const missing = WALLET_CAPABILITIES.filter((c) => !(w?.granted ?? []).includes(c));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Wallet size={20} className="text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold">My wallet</h1>
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-primary">from Sage</span>
      </div>
      <p className="text-xs text-fg-faint">
        Balances, assets, transactions and coins come from your Sage wallet; the mempool, blocks and other addresses still come from {networkConfig.label} via the configured node.
        {address ? (
          <>
            {" "}
            <Link href={routes.address(address)} className="text-accent hover:underline">
              Open this address in the explorer
            </Link>
            .
          </>
        ) : null}
      </p>
      {overview.isLoading && !w ? (
        <Skeleton className="h-24 w-full" />
      ) : !w ? (
        <EmptyState tone="danger" title="Sage did not answer" description="The wallet bridge could not be reached. Reopen the app from Sage's app list." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatTile label="Balance" value={`${formatXch(w.balance, 6)} ${w.ticker}`} tone="primary" sub={w.balance >= CHIA.MOJOS_PER_XCH ? undefined : `${w.balance.toString()} mojo`} />
            <StatTile label="Sync" value={w.totalCoins ? `${Math.round((w.syncedCoins / Math.max(1, w.totalCoins)) * 100)}%` : "100%"} sub={`${formatNumber(w.syncedCoins)} of ${formatNumber(w.totalCoins)} coins`} />
            <StatTile label="Pending" value={formatNumber(w.pending.length)} sub="transactions in flight" tone={w.pending.length ? "warning" : "default"} />
            <StatTile label="History" value={txTotal ? formatNumber(txTotal) : "…"} sub={`transactions · ${coinTotal ? formatNumber(coinTotal) : "…"} coins`} />
          </div>
          {address ? (
            <Card>
              <CardHeader title="Receive address" />
              <CardBody>
                <Hash value={address} href={routes.address(address)} full copy className="text-sm" />
              </CardBody>
            </Card>
          ) : null}
          {missing.length > 0 ? (
            <p className="rounded-sm border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_8%,transparent)] px-3 py-2 text-xs text-fg-muted">
              Not granted in Sage: <span className="mono">{missing.join(", ")}</span>. The matching sections stay empty until you allow them.
            </p>
          ) : null}
          <Card>
            <CardHeader title={`Pending transactions${w.pending.length ? ` · ${w.pending.length}` : ""}`} />
            <CardBody>
              {w.pending.length === 0 ? <p className="py-4 text-center text-sm text-fg-faint">Nothing in flight.</p> : <ul className="divide-y divide-border/60">{w.pending.map((tx, i) => <TxRow key={tx.id ?? i} tx={tx} walletAddress={address} />)}</ul>}
            </CardBody>
          </Card>
          {txItems.length > 0 || txs.isLoading ? <AssetsCard assets={assets} loaded={txItems.length} total={txTotal} /> : null}
          <Card>
            <CardHeader title="Transactions" />
            <CardBody>
              {txs.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : txItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-faint">No transactions yet.</p>
              ) : (
                <>
                  <ul className="divide-y divide-border/60">
                    {txItems.map((tx, i) => (
                      <TxRow key={`${tx.height ?? "p"}-${i}`} tx={tx} walletAddress={address} />
                    ))}
                  </ul>
                  <LoadMore loaded={txItems.length} total={txTotal} hasMore={!!txs.hasNextPage} loading={txs.isFetchingNextPage} onMore={moreTxs} label="transactions" />
                </>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Coins" />
            <CardBody>
              {coins.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : coinItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-faint">No coins to show.</p>
              ) : (
                <>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Coin</Th>
                        <Th>Address</Th>
                        <Th className="text-right">Amount</Th>
                        <Th className="text-right">Created</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {coinItems.map((c) => (
                        <Tr key={c.coinId}>
                          <Td>
                            <Hash value={c.coinId} href={routes.coin(c.coinId)} head={8} tail={6} />
                          </Td>
                          <Td>
                            <Hash value={c.address} href={routes.address(c.address)} head={8} tail={5} />
                          </Td>
                          <Td className="tabular text-right">{formatAmount(c.amount)}</Td>
                          <Td className="tabular text-right text-fg-faint">{c.createdHeight ? formatNumber(c.createdHeight) : "—"}</Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                  <LoadMore loaded={coinItems.length} total={coinTotal} hasMore={!!coins.hasNextPage} loading={coins.isFetchingNextPage} onMore={moreCoins} label="coins" />
                </>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
