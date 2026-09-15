"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { CHIA } from "@/shared/config/networks";
import { formatAmount, formatNumber, formatXch } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { fetchWalletOverview, WALLET_CAPABILITIES, type WalletCoinRef, type WalletTx } from "@/shared/lib/sage/wallet";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetIcon, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton, StatTile, Table, Td, Th, Tr } from "@/shared/ui";

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

/** Your own wallet, read straight from Sage (only inside Sage). */
export function WalletPage() {
  const { inSage, walletAddress } = useSage();
  const { networkConfig } = useSettings();
  const overview = useQuery({
    queryKey: ["sageWallet", networkConfig.id],
    queryFn: fetchWalletOverview,
    enabled: inSage,
    refetchInterval: 15_000,
  });

  if (!inSage) {
    return (
      <EmptyState
        title="Open mempoolxch.space inside the Sage wallet"
        description="This page reads balances, pending transactions and coins directly from your wallet. In a browser, search for your address instead."
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
        Balances, transactions and coins come from your Sage wallet; the mempool, blocks and other addresses still come from {networkConfig.label} via the configured node.
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
            <StatTile label="Coins" value={formatNumber(w.totalCoinCount)} sub="unspent" />
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
          <Card>
            <CardHeader title={`Recent transactions${w.totalTransactions ? ` · ${formatNumber(w.totalTransactions)} total` : ""}`} />
            <CardBody>
              {w.recent.length === 0 ? <p className="py-4 text-center text-sm text-fg-faint">No transactions yet.</p> : <ul className="divide-y divide-border/60">{w.recent.map((tx, i) => <TxRow key={i} tx={tx} walletAddress={address} />)}</ul>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Coins" />
            <CardBody>
              {w.coins.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-faint">No coins to show.</p>
              ) : (
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
                    {w.coins.map((c) => (
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
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
