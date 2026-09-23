"use client";

import { QRCodeSVG } from "qrcode.react";
import { useDetailId } from "@/shared/hooks/useDetailId";
import Link from "next/link";
import { useMemo } from "react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatCat, formatNumber } from "@/shared/lib/chia/amounts";
import { formatAge } from "@/shared/lib/format/time";
import { useT } from "@/shared/i18n/useT";
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
import { AddressNfts } from "./AddressNfts";
import { DidProfileCard } from "@/widgets/did/DidProfileCard";
import { useDidHoldings } from "@/widgets/did/useDidProfile";
import { formatHandle } from "@/shared/lib/handles/xchandles";
import { useAddressHandle } from "@/widgets/handle/useHandle";
import { OffersCard } from "@/widgets/offers/OffersCard";
import { ClawbacksCard } from "./ClawbacksCard";
import { useAddressData, type CoinFallback } from "./useAddressData";

function Unavailable({ what }: { what: string }) {
  const t = useT("address");
  return (
    <p className="rounded-sm border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-3 py-2 text-xs text-fg-muted">
      {t.rich("unavailable", {
        what,
        b: (chunks) => <span className="font-semibold text-warning">{chunks}</span>,
        link: (chunks) => (
          <Link href={routes.settings()} className="text-accent hover:underline">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}

export function AddressPage() {
  const t = useT("address");
  const raw = useDetailId("address") ?? "";
  const { networkConfig, endpoints } = useSettings();
  const resolved = useMemo(
    () => resolveAddressId(raw, networkConfig.addressPrefix),
    [raw, networkConfig.addressPrefix]
  );
  const data = useAddressData(resolved?.puzzleHash ?? null);
  const tokens = useTokenList();
  // Shares its queries with the profile card below (same key), so a DID costs no extra request.
  const did = useDidHoldings(resolved?.kind === "did" ? resolved.puzzleHash : null);
  const handle = useAddressHandle(resolved?.kind === "address" ? resolved.puzzleHash : null);

  if (!resolved) {
    return (
      <EmptyState
        tone="danger"
        title={t("invalid.title")}
        description={t("invalid.description", {
          prefix: networkConfig.addressPrefix,
          raw: raw || t("invalid.empty"),
        })}
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
          title={isDid ? t("header.did") : t("header.address")}
          action={
            <span className="flex items-center gap-2">
              <Badge tone={endpoints.network === "mainnet" ? "primary" : "warning"}>
                {networkConfig.label}
              </Badge>
              {isDid ? <Badge tone="did">did:chia</Badge> : null}
              <WatchButton
                kind={isDid ? "did" : "address"}
                id={ph}
                label={isDid ? (resolved.didId ?? addressText) : addressText}
              />
            </span>
          }
        />
        <CardBody className="flex flex-col gap-4 md:flex-row md:items-start">
          <div
            className="shrink-0 self-center rounded-card bg-white p-2 md:self-start"
            aria-label={t("header.qrLabel", { address: addressText })}
            role="img"
          >
            <QRCodeSVG
              title={t("header.qrTitle")}
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
                {isDid ? t("header.didId") : t("header.address")}
              </dt>
              <dd className="mono flex min-w-0 items-center gap-1 break-all text-base">
                {addressText}
                <CopyButton value={addressText} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                {isDid ? t("header.launcherId") : t("header.puzzleHash")}
              </dt>
              <dd className="mono flex min-w-0 items-center gap-1 break-all text-xs text-fg-muted">
                0x{ph}
                <CopyButton value={`0x${ph}`} />
              </dd>
            </div>
            {handle.data ? (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("header.handles")}
                </dt>
                <dd className="flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    href={routes.handle(handle.data.handle)}
                    className="mono inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                  >
                    {formatHandle(handle.data.handle)}
                  </Link>
                  {handle.data.count > 1 ? (
                    <span className="text-xs text-fg-faint">
                      {t("header.moreHandles", { count: handle.data.count - 1 })}
                    </span>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {!isDid ? (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("header.otherPrefix")}
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

      {isDid ? <DidProfileCard launcherId={ph} didId={resolved.didId ?? addressText} /> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("stats.xchBalance")}
          value={
            xchBalance !== undefined ? (
              formatAmount(xchBalance)
            ) : data.xch.isLoading || data.coins.isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              t("notAvailable")
            )
          }
          sub={
            data.indexed && data.xch.data
              ? pendingDelta !== 0n
                ? t("stats.pending", {
                    amount: `${pendingDelta > 0n ? "+" : "−"}${formatAmount(pendingDelta < 0n ? -pendingDelta : pendingDelta)}`,
                  })
                : t("stats.noPendingChange")
              : t("stats.fromUnspent")
          }
          tone="primary"
        />
        <StatTile
          label={t("stats.catBalances")}
          value={
            data.indexed
              ? data.cats.data
                ? formatNumber(data.cats.data.filter((c) => c.confirmed > 0n).length)
                : "…"
              : t("notAvailable")
          }
          sub={data.indexed ? t("stats.tokensHeld") : t("needsCoinset")}
        />
        {isDid ? (
          <StatTile
            label={t("stats.nfts")}
            href={did.available ? routes.ownedNfts(resolved.didId ?? addressText) : undefined}
            value={
              !did.available
                ? t("notAvailable")
                : did.isLoading
                  ? "…"
                  : did.profile?.ownedNfts !== null && did.profile?.ownedNfts !== undefined
                    ? formatNumber(did.profile.ownedNfts)
                    : t("notAvailable")
            }
            sub={did.available ? t("stats.didNftsSub") : t("stats.needsMainnet")}
            hint={t("stats.didNftsHint")}
          />
        ) : (
          <StatTile
            label={t("stats.nfts")}
            href={data.indexed ? routes.ownedNfts(addressText) : undefined}
            value={
              data.indexed
                ? data.nfts.data !== undefined
                  ? formatNumber(data.nfts.data)
                  : "…"
                : t("notAvailable")
            }
            sub={data.indexed ? t("stats.ownedNftsSub") : t("needsCoinset")}
          />
        )}
        <StatTile
          label={t("stats.unspentCoins")}
          value={unspentCount !== null ? formatNumber(unspentCount) : "…"}
          sub={
            coins
              ? t("stats.unspentSub", {
                  xch: formatNumber(coins.xchCoins.length),
                  hinted: coins.hintedCoins
                    ? t("stats.hinted", { count: coins.hintedCoins.length })
                    : t("stats.hintedNa"),
                })
              : undefined
          }
          hint={t("stats.unspentHint")}
        />
      </div>

      {!data.indexed ? <Unavailable what={t("unavailableWhat")} /> : null}

      {isDid && did.available ? <AddressNfts owner={{ kind: "did", id: ph }} /> : null}

      {data.indexed &&
      data.cats.data &&
      data.cats.data.some((c) => c.confirmed > 0n || c.pending !== 0n) ? (
        <Card>
          <CardHeader title={t("cats.title")} />
          <CardBody>
            <Table>
              <thead>
                <tr>
                  <Th>{t("cats.token")}</Th>
                  <Th className="hidden md:table-cell">{t("cats.assetId")}</Th>
                  <Th className="text-right">{t("cats.confirmed")}</Th>
                  <Th className="text-right">{t("cats.pending")}</Th>
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
                              alt={token?.name ?? t("cats.tokenAlt")}
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
            title={
              data.pending.transactions.length
                ? t("pending.titleCount", { count: data.pending.transactions.length })
                : t("pending.title")
            }
            action={<span className="text-[11px] text-fg-faint">{t("pending.refreshes")}</span>}
          />
          <CardBody>
            <TxSummaryList
              transactions={data.pending.transactions}
              loading={data.pending.isLoading}
              error={data.pending.error}
              viewedP2={ph}
              tokens={tokens.data}
              emptyText={t("pending.empty")}
              hasMore={data.pending.hasMore}
              onLoadMore={data.pending.loadMore}
              loadingMore={data.pending.loadingMore}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={data.indexed ? t("history.title") : t("history.unspentTitle")} />
        <CardBody>
          {data.indexed ? (
            <TxSummaryList
              transactions={data.history.transactions}
              loading={data.history.isLoading}
              error={data.history.error}
              viewedP2={ph}
              tokens={tokens.data}
              emptyText={t("history.empty")}
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
        <OffersCard scope={{ kind: "address", p2: ph }} title={t("offersTitle")} />
      ) : null}
    </div>
  );
}

function otherPrefixAddress(ph: string, prefix: "xch" | "txch"): string {
  return puzzleHashToAddress(ph, prefix === "xch" ? "txch" : "xch");
}

function CoinList({ coins, loading }: { coins: CoinFallback | undefined; loading: boolean }) {
  const t = useT("address");
  if (loading && !coins) return <Skeleton className="h-24 w-full" />;
  const all = coins
    ? [
        ...coins.xchCoins.map((c) => ({ c, hinted: false })),
        ...(coins.hintedCoins ?? []).map((c) => ({ c, hinted: true })),
      ]
    : [];
  if (all.length === 0) return <EmptyState title={t("coins.empty")} />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t("coins.coin")}</Th>
          <Th>{t("coins.type")}</Th>
          <Th className="text-right">{t("coins.amount")}</Th>
          <Th className="text-right">{t("coins.confirmed")}</Th>
        </tr>
      </thead>
      <tbody>
        {all.slice(0, 200).map(({ c, hinted }) => (
          <Tr key={c.name}>
            <Td>
              <Hash value={c.name} href={routes.coin(c.name)} />
            </Td>
            <Td>
              {hinted ? (
                <Badge tone="cat">{t("coins.hintedAsset")}</Badge>
              ) : (
                <Badge tone="xch">XCH</Badge>
              )}
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
