/**
 * JSON parsing that keeps large integers exact. Chia amounts are uint64 mojos and the RPC
 * emits them as bare JSON numbers; anything above 2^53 would lose precision in JSON.parse.
 * Unquoted integers with 16+ digits are turned into tagged strings before parsing and
 * revived as bigint. Only positions right after `:`, `,` or `[` are touched, so digits inside
 * string values (hex ids, memos) are never affected.
 */
const BIG_INT_TAG = "@@bigint@@";
const BIG_INT_RE = /([:,[]\s*)(-?\d{16,})(?=\s*[,}\]])/g;

export function parseJsonSafe(text: string): unknown {
  const tagged = text.replace(
    BIG_INT_RE,
    (_m, lead: string, digits: string) => `${lead}"${BIG_INT_TAG}${digits}"`
  );
  return JSON.parse(tagged, (_key, value) =>
    typeof value === "string" && value.startsWith(BIG_INT_TAG)
      ? BigInt(value.slice(BIG_INT_TAG.length))
      : value
  );
}

/** JSON.stringify that serialises bigint as plain numbers (the RPC expects numbers). */
export function stringifyJsonSafe(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? Number(v) : v));
}

/** JSON.stringify that keeps bigint exact as tagged strings; parseJsonSafe revives them. */
export function stringifyJsonTagged(value: unknown): string {
  return JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? `${BIG_INT_TAG}${v.toString()}` : v));
}
