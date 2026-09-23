/**
 * Text for the goggles' tooltips, chips and legend. Pure (formatting helpers only, in the active
 * UI language) and unit tested in format.test.ts. Amounts arrive as bigint mojos or decimal
 * mojo strings and leave in XCH or CAT units: the goggles never print raw mojos.
 */
import {
  formatAmount,
  formatCat,
  formatCost,
  formatPercent,
  formatXch,
} from "@/shared/lib/chia/amounts";
import { safeAssets } from "@/shared/lib/mempool/assets";
import type { CompactAssets, TxKindHint } from "@/shared/lib/mempool/types";
import { plainT } from "@/shared/i18n/plain";
import { AGE_BUCKETS, SIZE_BUCKETS, type AgeBucketId, type SizeBucketId } from "./model";

const ONE_MICRO_XCH = 1_000_000n;

/**
 * An XCH amount in XCH units at any size. Below a millionth of an XCH the general formatter
 * switches to mojos; here the full 12 decimals are shown instead (one mojo is still "0.000000000001
 * XCH"), so nothing on the goggles reads as a raw mojo count.
 */
export function formatXchUnits(mojos: bigint): string {
  const abs = mojos < 0n ? -mojos : mojos;
  if (abs === 0n) return "0 XCH";
  if (abs < ONE_MICRO_XCH) return `${formatXch(mojos, 12)} XCH`;
  return formatAmount(mojos);
}

/** Every asset a bundle spends, one line each: CATs (with ticker), NFTs, DIDs, singletons, XCH. */
export function assetLines(
  input: CompactAssets | undefined | null,
  kind: TxKindHint,
  tickers: (assetId: string) => string | undefined
): string[] {
  const assets = safeAssets(input);
  const t = plainT("common");
  const lines: string[] = [];
  [...assets.cats]
    .sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1))
    .forEach((c) => lines.push(`${formatCat(BigInt(c.amount))} ${tickers(c.assetId) ?? "CAT"}`));
  if (assets.nfts) lines.push(t("assets.nfts", { count: assets.nfts }));
  if (assets.dids) lines.push(t("assets.dids", { count: assets.dids }));
  if (assets.singletons)
    lines.push(
      kind === "pool"
        ? t("assets.poolClaims", { count: assets.singletons })
        : t("assets.singletons", { count: assets.singletons })
    );
  const xch = BigInt(assets.xch);
  if (xch > 0n || lines.length === 0) lines.push(formatXchUnits(xch));
  return lines;
}

/** Share of a whole as a percentage: one decimal below 10 %, "<0.1 %" for slivers. */
export function formatShare(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return formatPercent(0);
  if (ratio < 0.001) return `<${formatPercent(0.001, 1)}`;
  return formatPercent(ratio, ratio < 0.1 ? 1 : 0);
}

/** Bounds of a size bucket as cost text; `max` is null for the open-ended top bucket. */
export function sizeBucketBounds(id: SizeBucketId): { min: string; max: string | null } {
  const bucket = SIZE_BUCKETS.find((b) => b.id === id) ?? SIZE_BUCKETS[0];
  return {
    min: formatCost(bucket.min),
    max: Number.isFinite(bucket.max) ? formatCost(bucket.max) : null,
  };
}

/** Bounds of an age bucket in whole minutes; `max` is null for the open-ended bucket. */
export function ageBucketMinutes(id: AgeBucketId): { min: number; max: number | null } {
  const bucket = AGE_BUCKETS.find((b) => b.id === id) ?? AGE_BUCKETS[0];
  return {
    min: Math.round(bucket.min / 60_000),
    max: Number.isFinite(bucket.max) ? Math.round(bucket.max / 60_000) : null,
  };
}

/** Parse a fee-rate input ("", "5", "0,5"): null when empty or not a non-negative number. */
export function parseRateInput(text: string): number | null {
  const clean = text.trim().replace(",", ".");
  if (clean === "") return null;
  const value = Number(clean);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
