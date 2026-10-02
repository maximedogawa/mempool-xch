"use client";

import { useQuery } from "@tanstack/react-query";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { loadNftRecord } from "./mintgarden";
import { UNCLASSIFIED, classifyNft, type Sensitivity } from "./sensitivity";

/**
 * MintGarden's verdict on one /nfts/{id} record; a record MintGarden does not have (null) carries
 * no verdict and is veiled rather than taken on trust, the rule every other NFT surface follows.
 */
export function recordSensitivity(record: unknown): Sensitivity {
  return record === null || record === undefined ? UNCLASSIFIED : classifyNft(record);
}

function toNftId(launcherId: string): string | null {
  try {
    return launcherIdToNftId(launcherId);
  } catch {
    return null;
  }
}

/**
 * The verdict for an NFT the caller has only a launcher id for, such as one held in the Sage
 * wallet. It costs one MintGarden record per distinct NFT, through loadNftRecord's shared memo
 * (every other NFT surface reuses the same record) and its per-tab cap of concurrent requests.
 *
 * Null for anything that is not an NFT (no launcher id), so the caller can pass the result to
 * AssetIcon unconditionally. Until the record answers, and when it cannot be had, the NFT counts
 * as unclassified: its icon stays the neutral glyph, so a blocked thumbnail never shows before
 * its verdict is known.
 */
export function useNftSensitivity(launcherId: string | null | undefined): Sensitivity | null {
  const nftId = launcherId ? toNftId(launcherId) : null;
  const verdict = useQuery({
    queryKey: ["nft-sensitivity", nftId],
    queryFn: async () => recordSensitivity(await loadNftRecord(nftId!)),
    enabled: !!nftId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  if (!launcherId) return null;
  return verdict.data ?? UNCLASSIFIED;
}
