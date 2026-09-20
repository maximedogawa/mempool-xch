/**
 * Resolves an ambiguous 32-byte hex id by probing the data source in a sensible order:
 * mempool item (pending tx) → indexed transaction → coin record → block header hash → offer →
 * CAT asset (any coin hinted to it) → puzzle hash (treated as an address). Returns every match so the UI
 * can show candidates when more than one lookup succeeds.
 */
import type { NetworkId } from "@/shared/config/networks";
import { launcherIdToDidId, puzzleHashToAddress } from "@/shared/lib/chia/address";
import { fetchHandle, parseHandle } from "@/shared/lib/handles/xchandles";
import { mintGardenCollectionUrl, searchMintGarden } from "@/shared/lib/nft/mintgarden";
import type { Sensitivity } from "@/shared/lib/nft/sensitivity";
import { routes } from "@/shared/lib/routes";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { NETWORKS } from "@/shared/config/networks";
import type { SearchTarget } from "./parse";

export interface SearchMatch {
  kind:
    "tx" | "coin" | "block" | "cat" | "address" | "nft" | "did" | "collection" | "offer" | "handle";
  label: string;
  href: string;
  /** CAT asset id (no 0x) so the result row can show the token icon and ticker. */
  assetId?: string;
  /** NFT/collection thumbnail, host-restricted by AssetImage itself when rendered. */
  thumbnailUrl?: string | null;
  sensitivity?: Sensitivity | null;
}

const SEARCH_RESULT_LIMIT = 5;

/**
 * Free-text name search. A word that could be an XCHandles handle is asked of the registry at
 * the same time as MintGarden's NFT and collection name search; a registered handle leads the
 * results, and a name nobody has taken leaves the MintGarden matches exactly as they were.
 */
export async function resolveText(value: string): Promise<SearchMatch[]> {
  const handle = parseHandle(value);
  const [{ nfts, collections }, handleRecord] = await Promise.all([
    searchMintGarden(value),
    handle ? probe(() => fetchHandle(handle)) : Promise.resolve(null),
  ]);
  const handleMatch: SearchMatch[] =
    handle && (handleRecord?.status === "active" || handleRecord?.status === "expired")
      ? [
          {
            kind: "handle",
            label: handleRecord.status === "expired" ? `${handle} (expired handle)` : handle,
            href: routes.handle(handle),
          },
        ]
      : [];
  return [
    ...handleMatch,
    ...nfts.slice(0, SEARCH_RESULT_LIMIT).map((n) => ({
      kind: "nft" as const,
      label: n.name ?? "NFT",
      href: routes.nft(n.nftId),
      thumbnailUrl: n.thumbnailUrl,
      sensitivity: n.sensitivity,
    })),
    // No in-app collection detail page yet; link out to MintGarden's own, same as the collections list page does.
    ...collections.slice(0, SEARCH_RESULT_LIMIT).map((c) => ({
      kind: "collection" as const,
      label: c.name ?? "Collection",
      href: mintGardenCollectionUrl(c.id),
      thumbnailUrl: c.thumbnailUrl,
      sensitivity: c.sensitivity,
    })),
  ];
}

async function probe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function resolveHex32(
  client: RpcClient,
  network: NetworkId,
  hex: string
): Promise<SearchMatch[]> {
  const [mempoolItem, tx, coin, block, offer] = await Promise.all([
    probe(() => client.getMempoolItemByTxId(hex)),
    client.hasIndexed ? probe(() => client.getTransaction(hex)) : Promise.resolve(null),
    probe(() => client.getCoinRecordByName(hex)),
    probe(() => client.getBlockRecord(hex)),
    client.hasIndexed ? probe(() => client.getOffer(hex)) : Promise.resolve(null),
  ]);
  const matches: SearchMatch[] = [];
  if (mempoolItem || tx) matches.push({ kind: "tx", label: "Transaction", href: routes.tx(hex) });
  if (coin) matches.push({ kind: "coin", label: "Coin", href: routes.coin(hex) });
  if (block)
    matches.push({ kind: "block", label: `Block ${block.height}`, href: routes.block(hex) });
  if (offer)
    matches.push({
      kind: "offer",
      label: `Offer (${offer.status.replace("_", " ")})`,
      href: routes.offer(hex),
    });
  if (matches.length > 0) return matches;

  // Slower probes only when nothing direct matched.
  const [catCoins, singleton] = await Promise.all([
    probe(() => client.getCoinRecordsByHint(hex, true)),
    client.hasIndexed ? probe(() => client.getSingletonInfo(hex)) : Promise.resolve(null),
  ]);
  if (singleton?.singletonType === "nft")
    matches.push({ kind: "nft", label: "NFT", href: routes.nft(hex) });
  else if (singleton?.singletonType === "did")
    // As the did:chia: id, so the page opens as a DID rather than reading the launcher id as a
    // puzzle hash.
    matches.push({ kind: "did", label: "DID", href: routes.address(launcherIdToDidId(hex)) });
  if (catCoins && catCoins.length > 0 && !singleton) {
    matches.push({ kind: "cat", label: "CAT asset", href: routes.cat(hex), assetId: hex });
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
