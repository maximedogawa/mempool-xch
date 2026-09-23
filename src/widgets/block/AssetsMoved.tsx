"use client";

import Link from "next/link";
import { useTokenList } from "@/shared/api/useTokenList";
import type { BlockAssetTotals } from "@/shared/lib/blocks/assetTotals";
import { formatAmount, formatCat, formatNumber } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { AssetIcon, Card, CardBody, CardHeader, Skeleton, StatTile, Tooltip } from "@/shared/ui";

/** "What moved" in a block: net XCH, CATs per asset, NFTs, pool claims. */
export function AssetsMoved({
  totals,
  loading,
}: {
  totals: BlockAssetTotals | undefined;
  loading: boolean;
}) {
  const t = useT("block");
  const tokens = useTokenList();
  const hint = totals?.source === "rpc" ? t("moved.hintRpc") : t("moved.hintNet");
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("moved.title")} <Tooltip text={hint} />
          </span>
        }
        action={
          totals ? (
            <span className="text-xs text-fg-faint">
              {totals.source === "coinset"
                ? t(totals.partial ? "moved.transactionsPartial" : "moved.transactions", {
                    count: totals.count,
                  })
                : t("moved.coinSpends", { count: totals.count })}
            </span>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-3">
        {loading || !totals ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <StatTile
                label="XCH"
                value={formatAmount(BigInt(totals.xch))}
                tone="primary"
                sub={totals.source === "rpc" ? t("moved.grossSpent") : t("moved.netTransferred")}
              />
              <StatTile
                label={t("moved.catTransfers")}
                value={formatNumber(totals.cats.length)}
                sub={totals.cats.length ? t("moved.assets") : t("moved.none")}
              />
              <StatTile
                label={t("moved.nfts")}
                value={formatNumber(totals.nfts)}
                sub={t("moved.nftsSub")}
              />
              <StatTile
                label={t("moved.singletons")}
                value={formatNumber(totals.singletons + totals.dids)}
                sub={totals.source === "rpc" ? t("moved.spends") : t("moved.naWithSummaries")}
              />
            </div>
            {totals.cats.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {[...totals.cats]
                  .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1))
                  .map((c) => {
                    const token = tokens.data?.[c.assetId];
                    return (
                      <li key={c.assetId}>
                        <Link
                          href={routes.cat(c.assetId)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-2.5 py-1 text-xs hover:border-border-strong"
                          title={token?.name ?? c.assetId}
                        >
                          <AssetIcon kind="cat" assetId={c.assetId} size={16} />
                          <span className="tabular font-medium">
                            {formatCat(BigInt(c.amount))}{" "}
                            {token?.symbol ?? shortId(c.assetId, 4, 4)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
