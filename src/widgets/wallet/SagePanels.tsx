"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { formatAmount, formatNumber, formatPercent, formatXch } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { formatFixed } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import {
  checkWalletAddress,
  fetchWalletCoin,
  fetchWalletOverview,
  SAGE_PRICE_QUERY,
} from "@/shared/lib/sage/wallet";
import { useSageCapability } from "@/shared/lib/sage/useCapability";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader, Hash, StatTile } from "@/shared/ui";
import walletNs from "@/shared/i18n/messages/en/wallet";

/** Share of the wallet's coins that Sage has synced, as a locale percentage. */
export function syncPercent(synced: number, total: number): string {
  return formatPercent(total ? synced / Math.max(1, total) : 1, 0);
}

function SageBadge() {
  const t = useT(walletNs);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      <Wallet size={11} aria-hidden="true" /> {t("sageBadge")}
    </span>
  );
}

/**
 * On an address page inside Sage: when the address belongs to the wallet, the balance, pending
 * transactions and coin count come straight from the wallet bridge, ahead of the indexed data.
 */
export function SageAddressPanel({ address }: { address: string }) {
  const t = useT(walletNs);
  const { inSage } = useSage();
  const { networkConfig } = useSettings();
  const mine = useQuery({
    queryKey: ["sageOwns", networkConfig.id, address],
    queryFn: () => checkWalletAddress(address),
    enabled: inSage,
    staleTime: 5 * 60_000,
  });
  const overview = useQuery({
    queryKey: ["sageWallet", networkConfig.id],
    queryFn: fetchWalletOverview,
    enabled: inSage && mine.data === true,
    refetchInterval: 15_000,
  });
  if (!inSage || mine.data !== true || !overview.data) return null;
  const w = overview.data;
  return (
    <Card className="border-primary/40">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("addressPanel.title")} <SageBadge />
          </span>
        }
        action={
          <Link href={routes.wallet()} className="text-xs font-medium text-accent hover:underline">
            {t("addressPanel.open")}
          </Link>
        }
      />
      <CardBody className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile
          label={t("stats.balance")}
          value={`${formatXch(w.balance, 6)} ${w.ticker}`}
          tone="primary"
        />
        <StatTile
          label={t("stats.pending")}
          value={formatNumber(w.pending.length)}
          sub={t("stats.inFlight")}
          tone={w.pending.length ? "warning" : "default"}
        />
        <StatTile
          label={t("stats.coins")}
          value={formatNumber(w.totalCoinCount)}
          sub={t("stats.unspentInWallet")}
        />
        <StatTile
          label={t("stats.sync")}
          value={syncPercent(w.syncedCoins, w.totalCoins)}
          sub={t("stats.syncedCoins", {
            synced: formatNumber(w.syncedCoins),
            total: formatNumber(w.totalCoins),
          })}
        />
      </CardBody>
    </Card>
  );
}

/** On a coin page inside Sage: the wallet's own record of the coin, when it owns it. */
export function SageCoinPanel({ coinId }: { coinId: string }) {
  const t = useT(walletNs);
  const { inSage } = useSage();
  const { networkConfig } = useSettings();
  const coin = useQuery({
    queryKey: ["sageCoin", networkConfig.id, coinId],
    queryFn: () => fetchWalletCoin(coinId),
    enabled: inSage,
    staleTime: 30_000,
  });
  if (!inSage || !coin.data) return null;
  const c = coin.data;
  return (
    <Card className="border-primary/40">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("coinPanel.title")} <SageBadge />
          </span>
        }
      />
      <CardBody className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label={t("coinPanel.amount")} value={formatAmount(c.amount)} tone="primary" />
        <StatTile
          label={t("coinPanel.address")}
          value={<Hash value={c.address} href={routes.address(c.address)} head={8} tail={5} />}
        />
        <StatTile
          label={t("coinPanel.created")}
          value={c.createdHeight ? formatNumber(c.createdHeight) : t("coinPanel.pending")}
          sub={t("coinPanel.blockHeight")}
        />
        <StatTile
          label={t("coinPanel.spent")}
          value={c.spentHeight ? formatNumber(c.spentHeight) : t("coinPanel.unspent")}
          sub={c.spentHeight ? t("coinPanel.blockHeight") : t("coinPanel.stillInWallet")}
          tone={c.spentHeight ? "default" : "primary"}
        />
      </CardBody>
    </Card>
  );
}

/** XCH price chip from the wallet's own feed, header only, Sage only. */
export function SagePriceChip() {
  const t = useT(walletNs);
  const { inSage } = useSage();
  const { granted } = useSageCapability("wallet.get_xch_usd_price");
  const price = useQuery({ ...SAGE_PRICE_QUERY, enabled: inSage && granted });
  if (!inSage || price.data === null || price.data === undefined) return null;
  return (
    <span
      className="tabular hidden items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-fg-muted md:inline-flex"
      title={t("priceChip.title", { age: formatAge(price.dataUpdatedAt) })}
    >
      XCH <span className="font-semibold text-fg">${formatFixed(price.data, 2)}</span>
    </span>
  );
}
