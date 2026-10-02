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
  /** singleton_top_layer.clsp (v1), still used by plot NFTs (pooling). */
  SINGLETON_TOP_LAYER_V1: "24e044101e57b3d8c908b8a38ad57848afd29d3eecc439dba45f4412df4954fd",
  /** Pool reward puzzle-hash prefix curried into pool singletons (mainnet genesis challenge prefix). */
  POOL_REWARD_PREFIX: "ccd5bb71183532bff220ba46c268991a00000000000000000000000000000000",
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

/** Kind and asset id of one coin spend, from its puzzle reveal and coin puzzle hash. */
export function classifyCoinSpend(spend: CoinSpend): { kind: TxKindHint; assetId?: string } {
  const reveal = spend.puzzleReveal.toLowerCase().replace(/^0x/, "");
  if (spend.coin.puzzleHash === MOD_HASHES.SETTLEMENT_PAYMENTS) return { kind: "offer" };
  const launcher = extractLauncherIds(reveal)[0];
  if (
    reveal.includes(MOD_HASHES.NFT_STATE_LAYER) ||
    reveal.includes(MOD_HASHES.NFT_OWNERSHIP_LAYER)
  )
    return { kind: "nft", assetId: launcher };
  if (reveal.includes(MOD_HASHES.DID_INNERPUZ)) return { kind: "did", assetId: launcher };
  if (reveal.includes(MOD_HASHES.CAT2))
    return { kind: "cat", assetId: extractCatAssetIds(reveal)[0] };
  if (
    reveal.includes(MOD_HASHES.SINGLETON_TOP_LAYER_V1) &&
    reveal.includes(MOD_HASHES.POOL_REWARD_PREFIX)
  )
    return { kind: "pool", assetId: launcher };
  if (
    reveal.includes(MOD_HASHES.SINGLETON_TOP_LAYER_V1_1) ||
    reveal.includes(MOD_HASHES.SINGLETON_TOP_LAYER_V1)
  )
    return { kind: "singleton", assetId: launcher };
  return { kind: "xch" };
}

const KIND_PRIORITY: TxKindHint[] = [
  "offer",
  "nft",
  "did",
  "cat",
  "pool",
  "singleton",
  "xch",
  "unknown",
];

/** Bundle-level kind (most specific kind of any spend) and every asset id seen. */
export function classifyCoinSpends(coinSpends: CoinSpend[]): Classification {
  if (coinSpends.length === 0) return { kind: "unknown", assetIds: [] };
  const per = coinSpends.map(classifyCoinSpend);
  const kind = KIND_PRIORITY.find((k) => per.some((p) => p.kind === k)) ?? "unknown";
  const assetIds = [...new Set(per.map((p) => p.assetId).filter((a): a is string => !!a))];
  return { kind, assetIds };
}

export function classifyMempoolItem(item: MempoolItem): Classification {
  return classifyCoinSpends(item.spendBundle.coinSpends);
}
