"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { formatAmount, formatNumber, formatXch } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { checkWalletAddress, fetchWalletCoin, fetchWalletOverview, fetchXchUsdPrice } from "@/shared/lib/sage/wallet";
import { useSageCapability } from "@/shared/lib/sage/useCapability";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader, Hash, StatTile } from "@/shared/ui";

function SageBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      <Wallet size={11} aria-hidden="true" /> from your Sage wallet
    </span>
  );
}

/**
 * On an address page inside Sage: when the address belongs to the wallet, the balance, pending
 * transactions and coin count come straight from the wallet bridge, ahead of the indexed data.
 */
export function SageAddressPanel({ address }: { address: string }) {
  const { inSage } = useSage();
  const { networkConfig } = useSettings();
  const mine = useQuery({ queryKey: ["sageOwns", networkConfig.id, address], queryFn: () => checkWalletAddress(address), enabled: inSage, staleTime: 5 * 60_000 });
  const overview = useQuery({ queryKey: ["sageWallet", networkConfig.id], queryFn: fetchWalletOverview, enabled: inSage && mine.data === true, refetchInterval: 15_000 });
  if (!inSage || mine.data !== true || !overview.data) return null;
  const w = overview.data;
  return (
    <Card className="border-primary/40">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Your wallet <SageBadge />
          </span>
        }
        action={
          <Link href={routes.wallet()} className="text-xs font-medium text-accent hover:underline">
            Open My wallet →
          </Link>
        }
      />
      <CardBody className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Balance" value={`${formatXch(w.balance, 6)} ${w.ticker}`} tone="primary" />
        <StatTile label="Pending" value={formatNumber(w.pending.length)} sub="transactions in flight" tone={w.pending.length ? "warning" : "default"} />
        <StatTile label="Coins" value={formatNumber(w.totalCoinCount)} sub="unspent in the wallet" />
        <StatTile label="Sync" value={w.totalCoins ? `${Math.round((w.syncedCoins / Math.max(1, w.totalCoins)) * 100)}%` : "100%"} sub={`${formatNumber(w.syncedCoins)} of ${formatNumber(w.totalCoins)} coins`} />
      </CardBody>
    </Card>
  );
}

/** On a coin page inside Sage: the wallet's own record of the coin, when it owns it. */
export function SageCoinPanel({ coinId }: { coinId: string }) {
  const { inSage } = useSage();
  const { networkConfig } = useSettings();
  const coin = useQuery({ queryKey: ["sageCoin", networkConfig.id, coinId], queryFn: () => fetchWalletCoin(coinId), enabled: inSage, staleTime: 30_000 });
  if (!inSage || !coin.data) return null;
  const c = coin.data;
  return (
    <Card className="border-primary/40">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Your coin <SageBadge />
          </span>
        }
      />
      <CardBody className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Amount" value={formatAmount(c.amount)} tone="primary" />
        <StatTile label="Address" value={<Hash value={c.address} href={routes.address(c.address)} head={8} tail={5} />} />
        <StatTile label="Created" value={c.createdHeight ? formatNumber(c.createdHeight) : "pending"} sub="block height" />
        <StatTile label="Spent" value={c.spentHeight ? formatNumber(c.spentHeight) : "unspent"} sub={c.spentHeight ? "block height" : "still in the wallet"} tone={c.spentHeight ? "default" : "primary"} />
      </CardBody>
    </Card>
  );
}

/** XCH price chip from the wallet's own feed, header only, Sage only. */
export function SagePriceChip() {
  const { inSage } = useSage();
  const { granted } = useSageCapability("wallet.get_xch_usd_price");
  const price = useQuery({ queryKey: ["sagePrice"], queryFn: fetchXchUsdPrice, enabled: inSage && granted, refetchInterval: 60_000 });
  if (!inSage || price.data === null || price.data === undefined) return null;
  return (
    <span className="tabular hidden items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-fg-muted md:inline-flex" title={`XCH price from your Sage wallet, ${formatAge(price.dataUpdatedAt)}`}>
      XCH <span className="font-semibold text-fg">${price.data.toFixed(2)}</span>
    </span>
  );
}
