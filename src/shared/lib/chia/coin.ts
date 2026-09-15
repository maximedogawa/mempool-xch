import type { Coin } from "@/shared/lib/rpc/types";
import { hexToBytes, bytesToHex } from "./hex";
import { sha256 } from "./sha256";

/** Coin id = sha256(parent_coin_info || puzzle_hash || amount as a minimal big-endian int). */
export function coinName(coin: Coin): string {
  const parent = hexToBytes(coin.parentCoinInfo);
  const ph = hexToBytes(coin.puzzleHash);
  const amount = encodeAmount(coin.amount);
  const buf = new Uint8Array(parent.length + ph.length + amount.length);
  buf.set(parent, 0);
  buf.set(ph, parent.length);
  buf.set(amount, parent.length + ph.length);
  return bytesToHex(sha256(buf));
}

/** Chia serialises the amount as a minimal two's-complement big-endian integer (CLVM atom). */
export function encodeAmount(amount: bigint): Uint8Array {
  if (amount === 0n) return new Uint8Array(0);
  let hexStr = amount.toString(16);
  if (hexStr.length % 2 === 1) hexStr = `0${hexStr}`;
  const bytes = hexToBytes(hexStr);
  // Positive numbers whose top bit is set need a leading zero byte.
  if ((bytes[0] ?? 0) & 0x80) {
    const out = new Uint8Array(bytes.length + 1);
    out.set(bytes, 1);
    return out;
  }
  return bytes;
}
