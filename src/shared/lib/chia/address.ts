import { bech32m } from "bech32";
import { bytesToHex, hexToBytes, stripHexPrefix, isHex } from "./hex";

const ADDRESS_LIMIT = 90;

/** Puzzle hash (32-byte hex) → bech32m address. */
export function puzzleHashToAddress(puzzleHash: string, prefix: "xch" | "txch"): string {
  const bytes = hexToBytes(puzzleHash);
  if (bytes.length !== 32) throw new Error("puzzle hash must be 32 bytes");
  return bech32m.encode(prefix, bech32m.toWords(bytes), ADDRESS_LIMIT);
}

export interface DecodedAddress {
  prefix: string;
  /** 32-byte hex without 0x. */
  hash: string;
}

/** Decode any Chia bech32m id (xch, txch, nft, did:chia:). Returns null when invalid. */
export function decodeBech32m(value: string): DecodedAddress | null {
  try {
    const decoded = bech32m.decode(value.trim().toLowerCase(), ADDRESS_LIMIT);
    const bytes = Uint8Array.from(bech32m.fromWords(decoded.words));
    if (bytes.length !== 32) return null;
    return { prefix: decoded.prefix, hash: bytesToHex(bytes) };
  } catch {
    return null;
  }
}

export function addressToPuzzleHash(address: string): string | null {
  const decoded = decodeBech32m(address);
  if (!decoded || (decoded.prefix !== "xch" && decoded.prefix !== "txch")) return null;
  return decoded.hash;
}

export function launcherIdToNftId(launcherId: string): string {
  return bech32m.encode("nft", bech32m.toWords(hexToBytes(launcherId)), ADDRESS_LIMIT);
}

export function nftIdToLauncherId(nftId: string): string | null {
  const decoded = decodeBech32m(nftId);
  return decoded?.prefix === "nft" ? decoded.hash : null;
}

export function launcherIdToDidId(launcherId: string): string {
  return bech32m.encode("did:chia:", bech32m.toWords(hexToBytes(launcherId)), ADDRESS_LIMIT);
}

export function didIdToLauncherId(didId: string): string | null {
  const decoded = decodeBech32m(didId);
  return decoded?.prefix === "did:chia:" ? decoded.hash : null;
}

/** Accepts an address or a raw puzzle hash and returns the puzzle hash, or null. */
export function resolvePuzzleHash(value: string): string | null {
  const v = value.trim();
  if (isHex(v, 32)) return stripHexPrefix(v);
  return addressToPuzzleHash(v);
}
