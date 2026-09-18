"use client";

import Link from "next/link";
import { useTokenList } from "@/shared/api/useTokenList";
import type { BlockAssetTotals } from "@/shared/lib/blocks/assetTotals";
import { formatAmount, formatCat, formatNumber } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
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
  const tokens = useTokenList();
  const hint =
    totals?.source === "rpc"
      ? "Without Coinset the figures are the gross amounts spent per kind (change included), from the block's coin spends."
      : "Net amounts that changed hands: for every participant the XCH or CAT it received minus what it sent, summed. Change returned to the sender and fees are not counted.";
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Moved in this block <Tooltip text={hint} />
          </span>
        }
        action={
          totals ? (
            <span className="text-xs text-fg-faint">
              {totals.source === "coinset"
                ? `${formatNumber(totals.count)} transactions${totals.partial ? " (first 200)" : ""}`
                : `${formatNumber(totals.count)} coin spends`}
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
                sub={totals.source === "rpc" ? "gross spent" : "net transferred"}
              />
              <StatTile
                label="CAT transfers"
                value={formatNumber(totals.cats.length)}
                sub={totals.cats.length ? "assets" : "none"}
              />
              <StatTile
                label="NFTs"
                value={formatNumber(totals.nfts)}
                sub="transferred or minted"
              />
              <StatTile
                label="Pool / singleton"
                value={formatNumber(totals.singletons + totals.dids)}
                sub={totals.source === "rpc" ? "spends" : "n/a with summaries"}
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
