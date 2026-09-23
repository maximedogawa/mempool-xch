"use client";

import { ExternalLink } from "lucide-react";
import { dexieIconUrl } from "@/shared/api/tokenList";
import { useDetailId } from "@/shared/hooks/useDetailId";
import { useCallback, useMemo } from "react";
import { useMempoolSummary } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatAmount, formatCost, formatNumber } from "@/shared/lib/chia/amounts";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { useT } from "@/shared/i18n/useT";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  EmptyState,
  Hash,
  KindBadge,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { tokenLabel } from "@/shared/api/tokenList";
import { TxSummaryList } from "./TxSummaryList";
import { usePagedTransactions } from "./usePagedTransactions";
import { useTokenList } from "@/shared/api/useTokenList";
import { OffersCard } from "@/widgets/offers/OffersCard";
import assetsNs from "@/shared/i18n/messages/en/assets";

export function CoinsetNotice({ what }: { what: string }) {
  const t = useT(assetsNs);
  return (
    <p className="rounded-sm border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,transparent)] px-3 py-2 text-xs text-fg-muted">
      {t.rich("coinsetNotice", {
        what,
        b: (c) => <span className="font-semibold text-warning">{c}</span>,
      })}
    </p>
  );
}

export function CatPage() {
  const t = useT(assetsNs);
  const raw = useDetailId("cat") ?? "";
  const assetId = normaliseId32(raw);
  const { client, endpoints } = useSettings();
  const tokens = useTokenList();
  const summary = useMempoolSummary();
  const id = assetId ?? "";
  const history = usePagedTransactions({
    queryKey: useCallback(
      (cursor: string | null) => queryKeys.cat(endpoints.network, id, "history", cursor),
      [endpoints.network, id]
    ),
    fetchPage: useCallback(
      (cursor: string | null, limit: number, signal: AbortSignal) =>
        client.getTransactionsByCatAssetId(id, { cursor: cursor ?? undefined, limit }, signal),
      [client, id]
    ),
    enabled: assetId !== null && client.hasIndexed,
  });
  const pending = useMemo(
    () =>
      (summary.data?.items ?? [])
        .filter((item) => item.assetIds.includes(id))
        .sort((a, b) => b.firstSeen - a.firstSeen),
    [summary.data, id]
  );

  if (!assetId) {
    return (
      <EmptyState
        tone="danger"
        title={t("cat.invalidTitle")}
        description={t("cat.invalidDescription", { raw: raw || t("empty") })}
      />
    );
  }
  const token = tokens.data?.[assetId];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title={t("cat.title")} action={<KindBadge kind="cat" />} />
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <AssetImage
            urls={[token?.iconUrl ?? dexieIconUrl(assetId)]}
            alt={token?.name ?? t("cat.iconAlt")}
            className="h-20 w-20 shrink-0"
            rounded="rounded-full"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h1 className="text-2xl font-semibold">
              {tokens.isLoading ? t("cat.loading") : tokenLabel(token, assetId)}
            </h1>
            {token?.description ? (
              <p
                className="line-clamp-4 text-sm text-fg-muted [overflow-wrap:anywhere]"
                title={token.description.length > 400 ? token.description : undefined}
              >
                {token.description.length > 400
                  ? `${token.description.slice(0, 400)}…`
                  : token.description}
              </p>
            ) : null}
            {!tokens.isLoading && !token ? (
              <p className="text-sm text-fg-faint">{t("cat.notListed")}</p>
            ) : null}
            <dl className="text-sm">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                {t("cat.assetId")}
              </dt>
              <dd className="mono flex items-center gap-1 break-all">
                0x{assetId}
                <CopyButton value={`0x${assetId}`} />
              </dd>
            </dl>
            {token?.website ? (
              <a
                href={token.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                {token.website.replace(/^https?:\/\//, "")}{" "}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            pending.length
              ? t("cat.pendingTitleCount", { count: pending.length })
              : t("cat.pendingTitle")
          }
          action={<span className="text-[11px] text-fg-faint">{t("cat.fromMempool")}</span>}
        />
        <CardBody>
          {pending.length === 0 ? (
            <EmptyState title={t("cat.noPending")} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("cat.colTxId")}</Th>
                  <Th className="text-right">{t("cat.colFee")}</Th>
                  <Th className="text-right">{t("cat.colCost")}</Th>
                  <Th className="text-right">{t("cat.colSeen")}</Th>
                </tr>
              </thead>
              <tbody>
                {pending.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <Hash value={item.id} href={routes.tx(item.id)} />
                    </Td>
                    <Td className="tabular text-right">{formatAmount(BigInt(item.fee))}</Td>
                    <Td className="tabular text-right">{formatCost(item.cost)}</Td>
                    <Td className="tabular text-right text-fg-faint">
                      {formatAge(item.firstSeen)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("cat.recentTitle")}
          action={
            history.transactions.length ? (
              <Badge tone="neutral">
                {t("cat.loaded", { count: formatNumber(history.transactions.length) })}
              </Badge>
            ) : null
          }
        />
        <CardBody>
          {client.hasIndexed ? (
            <TxSummaryList
              transactions={history.transactions}
              loading={history.isLoading}
              error={history.error}
              tokens={tokens.data}
              emptyText={t("cat.noTransactions")}
              hasMore={history.hasMore}
              onLoadMore={history.loadMore}
              loadingMore={history.loadingMore}
            />
          ) : (
            <CoinsetNotice what={t("cat.coinsetWhat")} />
          )}
        </CardBody>
      </Card>

      <OffersCard scope={{ kind: "cat", assetId }} title={t("cat.offersTitle")} />
    </div>
  );
}
