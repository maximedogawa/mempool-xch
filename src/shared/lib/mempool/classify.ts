/**
 * Heuristic asset-kind classification of a spend bundle from its puzzle reveals and coins.
 * Used when the Coinset semantic summary is not available (custom nodes, or before Coinset has
 * indexed a pending item). Detection looks for well-known puzzle mod hashes that appear as
 * curried atoms inside the serialised reveal, so it needs no CLVM interpreter.
 */
import type { CoinSpend, MempoolItem } from "@/shared/lib/rpc/types";
import type { TxKindHint } from "./types";

/** Well-known Chia puzzle mod hashes (hex, no prefix). */
export const MOD_HASHES = {
  CAT2: "37bef360ee858133b69d595a906dc45d01af50379dad515eb9518abb7c1d2a7a",
  SINGLETON_TOP_LAYER_V1_1: "7faa3253bfddd1e0decb0906b2dc6247bbc4cf608f58345d173adb63e8b47c9f",
  NFT_STATE_LAYER: "a04d9f57764f54a43e4030befb4d80026e870519aaa66334aef8304f5d0393c2",
  NFT_OWNERSHIP_LAYER: "c5abea79afaa001b5427dfa0c8cf42ca6e38f5748bd5a91cd5a6b8c7fbf4b0d0",
  DID_INNERPUZ: "33143d2bef64f14036742673afd158126b94284b4530a28c354fac202b0c910e",
  /** settlement_payments.clsp: the puzzle hash offers pay into. */
  SETTLEMENT_PAYMENTS: "bae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79",
} as const;

export interface Classification {
  kind: TxKindHint;
  assetIds: string[];
}

/**
 * Curried arguments serialise as `(c (q . ARG) ...)` = `ff04ffff01` + atom. The CAT2 tail (asset
 * id) is the argument right after the mod hash, so the reveal contains
 * `a0<mod hash>ffff04ffff01a0<tail hash>` (observed on mainnet, 2026-09-15).
 */
function extractCatAssetIds(reveal: string): string[] {
  const marker = `${MOD_HASHES.CAT2}ffff04ffff01a0`;
  const ids = new Set<string>();
  let idx = reveal.indexOf(marker);
  while (idx !== -1) {
    const start = idx + marker.length;
    const candidate = reveal.slice(start, start + 64);
    if (candidate.length === 64) ids.add(candidate);
    idx = reveal.indexOf(marker, start);
  }
  return [...ids];
}

/**
 * The singleton struct is `(MOD_HASH . (LAUNCHER_ID . LAUNCHER_PUZZLE_HASH))`, serialised as
 * `ffa0<mod hash>ffa0<launcher id>a0<launcher puzzle hash>`.
 */
function extractLauncherIds(reveal: string): string[] {
  const marker = `${MOD_HASHES.SINGLETON_TOP_LAYER_V1_1}ffa0`;
  const ids = new Set<string>();
  let idx = reveal.indexOf(marker);
  while (idx !== -1) {
    const start = idx + marker.length;
    const candidate = reveal.slice(start, start + 64);
    if (candidate.length === 64) ids.add(candidate);
    idx = reveal.indexOf(marker, start);
  }
  return [...ids];
}

export function classifyCoinSpends(coinSpends: CoinSpend[]): Classification {
  const reveals = coinSpends.map((cs) => cs.puzzleReveal.toLowerCase().replace(/^0x/, ""));
  const joined = reveals.join("|");
  const puzzleHashes = new Set(coinSpends.map((cs) => cs.coin.puzzleHash));

  const isOffer = puzzleHashes.has(MOD_HASHES.SETTLEMENT_PAYMENTS);
  const isNft =
    joined.includes(MOD_HASHES.NFT_STATE_LAYER) || joined.includes(MOD_HASHES.NFT_OWNERSHIP_LAYER);
  const isDid = joined.includes(MOD_HASHES.DID_INNERPUZ);
  const isCat = joined.includes(MOD_HASHES.CAT2);
  const isSingleton = joined.includes(MOD_HASHES.SINGLETON_TOP_LAYER_V1_1);

  const assetIds = isCat
    ? reveals.flatMap(extractCatAssetIds)
    : isNft || isDid || isSingleton
      ? reveals.flatMap(extractLauncherIds)
      : [];

  const kind: TxKindHint = isOffer
    ? "offer"
    : isNft
      ? "nft"
      : isDid
        ? "did"
        : isCat
          ? "cat"
          : isSingleton
            ? "singleton"
            : coinSpends.length > 0
              ? "xch"
              : "unknown";

  return { kind, assetIds: [...new Set(assetIds)] };
}

export function classifyMempoolItem(item: MempoolItem): Classification {
  return classifyCoinSpends(item.spendBundle.coinSpends);
}
