import { formatAmount, formatCat } from "@/shared/lib/chia/amounts";
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

export function primaryAsset(input: CompactAssets | undefined | null, fallbackKind: TxKindHint = "xch"): PrimaryAsset {
  const assets = safeAssets(input);
  const cats = [...assets.cats].sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1));
  if (cats[0]) return { kind: "cat", assetId: cats[0].assetId, amount: BigInt(cats[0].amount) };
  if (assets.nfts > 0) return { kind: "nft", amount: BigInt(assets.nfts) };
  if (assets.dids > 0) return { kind: "did", amount: BigInt(assets.dids) };
  if (assets.singletons > 0) return { kind: fallbackKind === "pool" ? "pool" : "singleton", amount: BigInt(assets.singletons) };
  return { kind: fallbackKind === "offer" ? "offer" : "xch", amount: BigInt(assets.xch) };
}

/** Text for a primary asset; `ticker` comes from the token list when known. */
export function formatPrimaryAsset(asset: PrimaryAsset, ticker?: string | null): string {
  switch (asset.kind) {
    case "cat":
      return `${formatCat(asset.amount)} ${ticker ?? "CAT"}`;
    case "nft":
      return `${asset.amount.toString()} NFT${asset.amount === 1n ? "" : "s"}`;
    case "did":
      return `${asset.amount.toString()} DID${asset.amount === 1n ? "" : "s"}`;
    case "singleton":
      return `${asset.amount.toString()} singleton${asset.amount === 1n ? "" : "s"}`;
    case "pool":
      return `${asset.amount.toString()} pool claim${asset.amount === 1n ? "" : "s"}`;
    default:
      return formatAmount(asset.amount);
  }
}

/** Short multi-asset summary, e.g. "1.234 SBX + 0.0104 XCH" or "1 NFT + 0.00001 XCH". */
export function formatAssets(input: CompactAssets | undefined | null, tickers: Record<string, string | undefined> = {}): string {
  const assets = safeAssets(input);
  const parts: string[] = [];
  assets.cats.forEach((c) => parts.push(`${formatCat(BigInt(c.amount))} ${tickers[c.assetId] ?? "CAT"}`));
  if (assets.nfts) parts.push(`${assets.nfts} NFT${assets.nfts === 1 ? "" : "s"}`);
  if (assets.dids) parts.push(`${assets.dids} DID${assets.dids === 1 ? "" : "s"}`);
  if (assets.singletons) parts.push(`${assets.singletons} singleton${assets.singletons === 1 ? "" : "s"}`);
  if (BigInt(assets.xch) > 0n || parts.length === 0) parts.push(formatAmount(BigInt(assets.xch)));
  return parts.join(" + ");
}
