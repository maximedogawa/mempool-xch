import { formatAmount, formatCat } from "@/shared/lib/chia/amounts";
import { plainT } from "@/shared/i18n/plain";
import type { CompactAssets, TxKindHint } from "./types";

export interface PrimaryAsset {
  kind: TxKindHint;
  assetId?: string;
  /** Mojos for xch/cat; count for nft/did/singleton. */
  amount: bigint;
}

/**
 * The one asset a bundle is "about", for single-line displays: the biggest CAT position if any
 * CAT is spent, otherwise NFTs, DIDs, singletons, otherwise the XCH spent.
 */
const EMPTY: CompactAssets = { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 };

/** Older summaries (server not yet upgraded) carry no assets; treat them as empty. */
export function safeAssets(assets: CompactAssets | undefined | null): CompactAssets {
  return assets && Array.isArray(assets.cats) ? assets : EMPTY;
}

export function primaryAsset(
  input: CompactAssets | undefined | null,
  fallbackKind: TxKindHint = "xch"
): PrimaryAsset {
  const assets = safeAssets(input);
  const cats = [...assets.cats].sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1));
  if (cats[0]) return { kind: "cat", assetId: cats[0].assetId, amount: BigInt(cats[0].amount) };
  if (assets.nfts > 0) return { kind: "nft", amount: BigInt(assets.nfts) };
  if (assets.dids > 0) return { kind: "did", amount: BigInt(assets.dids) };
  if (assets.singletons > 0)
    return {
      kind: fallbackKind === "pool" ? "pool" : "singleton",
      amount: BigInt(assets.singletons),
    };
  return { kind: fallbackKind === "offer" ? "offer" : "xch", amount: BigInt(assets.xch) };
}

/** Text for a primary asset; `ticker` comes from the token list when known. */
export function formatPrimaryAsset(asset: PrimaryAsset, ticker?: string | null): string {
  switch (asset.kind) {
    case "cat":
      return `${formatCat(asset.amount)} ${ticker ?? "CAT"}`;
    case "nft":
      return plainT("common")("assets.nfts", { count: asset.amount });
    case "did":
      return plainT("common")("assets.dids", { count: asset.amount });
    case "singleton":
      return plainT("common")("assets.singletons", { count: asset.amount });
    case "pool":
      return plainT("common")("assets.poolClaims", { count: asset.amount });
    default:
      return formatAmount(asset.amount);
  }
}

/** Short multi-asset summary, e.g. "1.234 SBX + 0.0104 XCH" or "1 NFT + 0.00001 XCH". */
export function formatAssets(
  input: CompactAssets | undefined | null,
  tickers: Record<string, string | undefined> = {}
): string {
  const assets = safeAssets(input);
  const t = plainT("common");
  const parts: string[] = [];
  assets.cats.forEach((c) =>
    parts.push(`${formatCat(BigInt(c.amount))} ${tickers[c.assetId] ?? "CAT"}`)
  );
  if (assets.nfts) parts.push(t("assets.nfts", { count: assets.nfts }));
  if (assets.dids) parts.push(t("assets.dids", { count: assets.dids }));
  if (assets.singletons) parts.push(t("assets.singletons", { count: assets.singletons }));
  if (BigInt(assets.xch) > 0n || parts.length === 0) parts.push(formatAmount(BigInt(assets.xch)));
  return parts.join(" + ");
}
