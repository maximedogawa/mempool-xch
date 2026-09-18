"use client";

import { QRCodeSVG } from "qrcode.react";
import { useDetailId } from "@/shared/hooks/useDetailId";
import Link from "next/link";
import { useMemo } from "react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatCat, formatNumber } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  EmptyState,
  Hash,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { tokenLabel } from "@/shared/api/tokenList";
import { TxSummaryList } from "@/widgets/assets/TxSummaryList";
import { useTokenList } from "@/shared/api/useTokenList";
import { resolveAddressId } from "./resolveAddressId";
import { SageAddressPanel } from "@/widgets/wallet/SagePanels";
import { WatchButton } from "@/widgets/watchlist/WatchButton";
import { OffersCard } from "@/widgets/offers/OffersCard";
import { ClawbacksCard } from "./ClawbacksCard";
import { useAddressData, type CoinFallback } from "./useAddressData";

function Unavailable({ what }: { what: string }) {
  return (
    <p className="rounded-sm border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-3 py-2 text-xs text-fg-muted">
      <span className="font-semibold text-warning">Unavailable with a custom node:</span> {what}{" "}
      need the Coinset indexed API. Switch the endpoint back to Coinset in{" "}
      <Link href={routes.settings()} className="text-accent hover:underline">
        settings
      </Link>{" "}
      to see them.
    </p>
  );
}

export function AddressPage() {
  const raw = useDetailId("address") ?? "";
  const { networkConfig, endpoints } = useSettings();
  const resolved = useMemo(
    () => resolveAddressId(raw, networkConfig.addressPrefix),
    [raw, networkConfig.addressPrefix]
  );
  const data = useAddressData(resolved?.puzzleHash ?? null);
  const tokens = useTokenList();

  if (!resolved) {
    return (
      <EmptyState
        tone="danger"
        title="Not a valid address"
        description={`Expected an ${networkConfig.addressPrefix}1… address, a 32-byte puzzle hash or a did:chia: id. Got: ${raw || "(empty)"}`}
      />
    );
  }

  const ph = resolved.puzzleHash;
  const addressText = resolved.address ?? resolved.didId ?? ph;
  const isDid = resolved.kind === "did";
  const coins = data.coins.data;
  const unspentCount = coins ? coins.xchCoins.length + (coins.hintedCoins?.length ?? 0) : null;
  const xchBalance = data.indexed ? data.xch.data?.confirmed : coins?.xchBalance;
  const pendingDelta = data.xch.data?.pending ?? 0n;

  return (
    <div className="flex flex-col gap-5">
      {resolved.address ? <SageAddressPanel address={resolved.address} /> : null}
      <Card>
        <CardHeader
          title={isDid ? "DID" : "Address"}
          action={
            <span className="flex items-center gap-2">
              <Badge tone={endpoints.network === "mainnet" ? "primary" : "warning"}>
                {networkConfig.label}
              </Badge>
              {isDid ? <Badge tone="did">did:chia</Badge> : null}
              {!isDid ? <WatchButton kind="address" id={ph} label={addressText} /> : null}
            </span>
          }
        />
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-start">
          <div
            className="shrink-0 self-center rounded-card bg-white p-2 md:self-start"
            aria-label={`QR code for ${addressText}`}
            role="img"
          >
            <QRCodeSVG
              title="QR code of this address"
              value={addressText}
              size={132}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f1220"
            />
          </div>
          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-3 text-sm">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                {isDid ? "DID id" : "Address"}
              </dt>
              <dd className="mono flex min-w-0 items-center gap-1 break-all text-base">
                {addressText}
                <CopyButton value={addressText} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                {isDid ? "Launcher id" : "Puzzle hash"}
              </dt>
              <dd className="mono flex min-w-0 items-center gap-1 break-all text-xs text-fg-muted">
                0x{ph}
                <CopyButton value={`0x${ph}`} />
              </dd>
            </div>
            {!isDid ? (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Other network prefix
                </dt>
                <dd className="mono flex min-w-0 items-center gap-1 break-all text-xs text-fg-faint">
                  {otherPrefixAddress(ph, networkConfig.addressPrefix)}
                  <CopyButton value={otherPrefixAddress(ph, networkConfig.addressPrefix)} />
                </dd>
              </div>
            ) : null}
          </dl>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="XCH balance"
          value={
            xchBalance !== undefined ? (
              formatAmount(xchBalance)
            ) : data.xch.isLoading || data.coins.isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              "n/a"
            )
          }
          sub={
            data.indexed && data.xch.data
              ? pendingDelta !== 0n
                ? `pending ${pendingDelta > 0n ? "+" : "−"}${formatAmount(pendingDelta < 0n ? -pendingDelta : pendingDelta)}`
                : "no pending change"
              : "from unspent coins"
          }
          tone="primary"
        />
        <StatTile
          label="CAT balances"
          value={
            data.indexed
              ? data.cats.data
                ? formatNumber(data.cats.data.filter((c) => c.confirmed > 0n).length)
                : "…"
              : "n/a"
          }
          sub={data.indexed ? "tokens held" : "needs Coinset"}
        />
        <StatTile
          label="NFTs"
          value={
            data.indexed
              ? data.nfts.data !== undefined
                ? formatNumber(data.nfts.data)
                : "…"
              : "n/a"
          }
          sub={data.indexed ? "owned" : "needs Coinset"}
        />
        <StatTile
          label="Unspent coins"
          value={unspentCount !== null ? formatNumber(unspentCount) : "…"}
          sub={
            coins
              ? `${formatNumber(coins.xchCoins.length)} XCH · ${coins.hintedCoins ? `${formatNumber(coins.hintedCoins.length)} hinted` : "hinted n/a"}`
              : undefined
          }
          hint="Coins locked to this puzzle hash plus CAT, NFT and DID coins hinted to it."
        />
      </div>

      {!data.indexed ? (
        <Unavailable what="Balances by asset, NFT count, pending and confirmed transaction history" />
      ) : null}

      {data.indexed &&
      data.cats.data &&
      data.cats.data.some((c) => c.confirmed > 0n || c.pending !== 0n) ? (
        <Card>
          <CardHeader title="CAT balances" />
          <CardBody>
            <Table>
              <thead>
                <tr>
                  <Th>Token</Th>
                  <Th className="hidden md:table-cell">Asset id</Th>
                  <Th className="text-right">Confirmed</Th>
                  <Th className="text-right">Pending</Th>
                </tr>
              </thead>
              <tbody>
                {data.cats.data
                  .filter((c) => c.confirmed > 0n || c.pending !== 0n)
                  .map((c) => {
                    const token = tokens.data?.[c.assetId];
                    return (
                      <Tr key={c.assetId}>
                        <Td>
                          <Link
                            href={routes.cat(c.assetId)}
                            className="flex items-center gap-2 hover:underline md:whitespace-nowrap"
                          >
                            <AssetImage
                              urls={token?.iconUrl ? [token.iconUrl] : []}
                              alt={token?.name ?? "token"}
                              className="h-6 w-6 shrink-0"
                              rounded="rounded-full"
                            />
                            <span className="font-medium">{tokenLabel(token, c.assetId)}</span>
                          </Link>
                        </Td>
                        <Td className="hidden whitespace-nowrap md:table-cell">
                          <Hash value={c.assetId} href={routes.cat(c.assetId)} />
                        </Td>
                        <Td className="tabular text-right">{formatCat(c.confirmed)}</Td>
                        <Td className="tabular text-right text-fg-muted">
                          {c.pending === 0n ? "—" : formatCat(c.pending)}
                        </Td>
                      </Tr>
                    );
                  })}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      {data.indexed && !isDid ? <ClawbacksCard p2={ph} /> : null}

      {data.indexed ? (
        <Card>
          <CardHeader
            title={`Pending transactions${data.pending.transactions.length ? ` (${data.pending.transactions.length})` : ""}`}
            action={<span className="text-[11px] text-fg-faint">refreshes every 10 s</span>}
          />
          <CardBody>
            <TxSummaryList
              transactions={data.pending.transactions}
              loading={data.pending.isLoading}
              error={data.pending.error}
              viewedP2={ph}
              tokens={tokens.data}
              emptyText="No pending transactions for this address."
              hasMore={data.pending.hasMore}
              onLoadMore={data.pending.loadMore}
              loadingMore={data.pending.loadingMore}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={data.indexed ? "Transaction history" : "Unspent coins"} />
        <CardBody>
          {data.indexed ? (
            <TxSummaryList
              transactions={data.history.transactions}
              loading={data.history.isLoading}
              error={data.history.error}
              viewedP2={ph}
              tokens={tokens.data}
              emptyText="No confirmed transactions found for this address."
              hasMore={data.history.hasMore}
              onLoadMore={data.history.loadMore}
              loadingMore={data.history.loadingMore}
            />
          ) : (
            <CoinList coins={coins} loading={data.coins.isLoading} />
          )}
        </CardBody>
      </Card>

      {data.indexed && !isDid ? (
        <OffersCard scope={{ kind: "address", p2: ph }} title="Offers made from this address" />
      ) : null}
    </div>
  );
}

function otherPrefixAddress(ph: string, prefix: "xch" | "txch"): string {
  return puzzleHashToAddress(ph, prefix === "xch" ? "txch" : "xch");
}

function CoinList({ coins, loading }: { coins: CoinFallback | undefined; loading: boolean }) {
  if (loading && !coins) return <Skeleton className="h-24 w-full" />;
  const all = coins
    ? [
        ...coins.xchCoins.map((c) => ({ c, hinted: false })),
        ...(coins.hintedCoins ?? []).map((c) => ({ c, hinted: true })),
      ]
    : [];
  if (all.length === 0) return <EmptyState title="No unspent coins." />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Coin</Th>
          <Th>Type</Th>
          <Th className="text-right">Amount</Th>
          <Th className="text-right">Confirmed</Th>
        </tr>
      </thead>
      <tbody>
        {all.slice(0, 200).map(({ c, hinted }) => (
          <Tr key={c.name}>
            <Td>
              <Hash value={c.name} href={routes.coin(c.name)} />
            </Td>
            <Td>
              {hinted ? <Badge tone="cat">hinted asset</Badge> : <Badge tone="xch">XCH</Badge>}
            </Td>
            <Td className="tabular text-right">
              {hinted ? `${formatNumber(Number(c.coin.amount))} mojo` : formatAmount(c.coin.amount)}
            </Td>
            <Td className="tabular text-right text-fg-faint">
              #{formatNumber(c.confirmedBlockIndex)} · {formatAge(c.timestamp * 1000)}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
