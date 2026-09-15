/**
 * Resolves an ambiguous 32-byte hex id by probing the data source in a sensible order:
 * mempool item (pending tx) → indexed transaction → coin record → block header hash → CAT asset
 * (any coin hinted to it) → puzzle hash (treated as an address). Returns every match so the UI
 * can show candidates when more than one lookup succeeds.
 */
import type { NetworkId } from "@/shared/config/networks";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { routes } from "@/shared/lib/routes";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { NETWORKS } from "@/shared/config/networks";
import type { SearchTarget } from "./parse";

export interface SearchMatch {
  kind: "tx" | "coin" | "block" | "cat" | "address" | "nft" | "did";
  label: string;
  href: string;
}

async function probe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function resolveHex32(client: RpcClient, network: NetworkId, hex: string): Promise<SearchMatch[]> {
  const [mempoolItem, tx, coin, block] = await Promise.all([
    probe(() => client.getMempoolItemByTxId(hex)),
    client.hasIndexed ? probe(() => client.getTransaction(hex)) : Promise.resolve(null),
    probe(() => client.getCoinRecordByName(hex)),
    probe(() => client.getBlockRecord(hex)),
  ]);
  const matches: SearchMatch[] = [];
  if (mempoolItem || tx) matches.push({ kind: "tx", label: "Transaction", href: routes.tx(hex) });
  if (coin) matches.push({ kind: "coin", label: "Coin", href: routes.coin(hex) });
  if (block) matches.push({ kind: "block", label: `Block ${block.height}`, href: routes.block(hex) });
  if (matches.length > 0) return matches;

  // Slower probes only when nothing direct matched.
  const [catCoins, singleton] = await Promise.all([
    probe(() => client.getCoinRecordsByHint(hex, true)),
    client.hasIndexed ? probe(() => client.getSingletonInfo(hex)) : Promise.resolve(null),
  ]);
  if (singleton?.singletonType === "nft") matches.push({ kind: "nft", label: "NFT", href: routes.nft(hex) });
  else if (singleton?.singletonType === "did") matches.push({ kind: "did", label: "DID", href: routes.address(hex) });
  if (catCoins && catCoins.length > 0 && !singleton) {
    matches.push({ kind: "cat", label: "CAT asset", href: routes.cat(hex) });
  }
  const address = puzzleHashToAddress(hex, NETWORKS[network].addressPrefix);
  matches.push({ kind: "address", label: "Address (puzzle hash)", href: routes.address(address) });
  return matches;
}

/** Direct routes for unambiguous targets; null for hex32 (needs probing) and invalid input. */
export function directRoute(target: SearchTarget): string | null {
  switch (target.kind) {
    case "height":
      return routes.block(target.height);
    case "address":
      return routes.address(target.address);
    case "nft":
      return routes.nft(target.nftId);
    case "did":
      return routes.address(target.didId);
    default:
      return null;
  }
}
