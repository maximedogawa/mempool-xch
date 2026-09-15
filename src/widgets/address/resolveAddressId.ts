/**
 * The address page accepts an xch/txch address, a raw 32-byte puzzle hash or a did:chia: id.
 */
import { didIdToLauncherId, puzzleHashToAddress, resolvePuzzleHash } from "@/shared/lib/chia/address";

export interface ResolvedAddressId {
  kind: "address" | "did";
  /** Puzzle hash (p2) without 0x; for a DID this is the launcher id. */
  puzzleHash: string;
  /** Address on the given prefix (for DIDs: the launcher id encoded as an address is meaningless, so null). */
  address: string | null;
  didId: string | null;
}

export function resolveAddressId(raw: string, prefix: "xch" | "txch"): ResolvedAddressId | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value.startsWith("did:chia:")) {
    const launcher = didIdToLauncherId(value);
    return launcher ? { kind: "did", puzzleHash: launcher, address: null, didId: value } : null;
  }
  const ph = resolvePuzzleHash(value);
  if (!ph) return null;
  return { kind: "address", puzzleHash: ph, address: puzzleHashToAddress(ph, prefix), didId: null };
}
