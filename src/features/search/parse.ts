/**
 * Search input recognition. Anything a Chia user might paste is classified by shape;
 * 32-byte hex is ambiguous (tx id, coin id, header hash, CAT asset id, puzzle hash, launcher id)
 * and is resolved by probing in `resolve.ts`.
 */
import { decodeBech32m } from "@/shared/lib/chia/address";
import { isHex, stripHexPrefix } from "@/shared/lib/chia/hex";

export type SearchTarget =
  | { kind: "height"; height: number }
  | { kind: "address"; address: string; puzzleHash: string; prefix: "xch" | "txch" }
  | { kind: "nft"; nftId: string; launcherId: string }
  | { kind: "did"; didId: string; launcherId: string }
  | { kind: "hex32"; hex: string }
  /** Free text matching no known id shape: a name to try against MintGarden. */
  | { kind: "text"; value: string }
  | { kind: "invalid"; reason: string };

export function parseSearchInput(raw: string): SearchTarget {
  const input = raw.trim();
  if (input === "") return { kind: "invalid", reason: "Type something to search for." };

  if (/^\d{1,9}$/.test(input)) return { kind: "height", height: Number(input) };

  const lower = input.toLowerCase();
  if (lower.startsWith("xch1") || lower.startsWith("txch1")) {
    const decoded = decodeBech32m(lower);
    if (decoded && (decoded.prefix === "xch" || decoded.prefix === "txch")) {
      return { kind: "address", address: lower, puzzleHash: decoded.hash, prefix: decoded.prefix };
    }
    return { kind: "invalid", reason: "That looks like an address but its checksum is wrong." };
  }
  if (lower.startsWith("nft1")) {
    const decoded = decodeBech32m(lower);
    if (decoded?.prefix === "nft") return { kind: "nft", nftId: lower, launcherId: decoded.hash };
    return { kind: "invalid", reason: "That looks like an NFT id but its checksum is wrong." };
  }
  if (lower.startsWith("offer1")) {
    return {
      kind: "invalid",
      reason:
        "That is an offer file, not an id. Its id only exists once the offer is published: upload it on Dexie, then search the offer id shown there or the address that made it.",
    };
  }
  if (lower.startsWith("did:chia:1")) {
    const decoded = decodeBech32m(lower);
    if (decoded?.prefix === "did:chia:")
      return { kind: "did", didId: lower, launcherId: decoded.hash };
    return { kind: "invalid", reason: "That looks like a DID but its checksum is wrong." };
  }
  if (isHex(input, 32)) return { kind: "hex32", hex: stripHexPrefix(input) };
  if (isHex(input)) {
    return { kind: "invalid", reason: "Hex ids must be 32 bytes (64 hex characters)." };
  }
  return { kind: "text", value: input };
}
