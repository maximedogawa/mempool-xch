/** Hex helpers: Chia ids travel with and without a `0x` prefix depending on the endpoint. */

export function stripHexPrefix(value: string): string {
  const v = value.trim().toLowerCase();
  return v.startsWith("0x") ? v.slice(2) : v;
}

export function withHexPrefix(value: string): string {
  return `0x${stripHexPrefix(value)}`;
}

export function isHex(value: string, bytes?: number): boolean {
  const v = stripHexPrefix(value);
  if (!/^[0-9a-f]*$/.test(v) || v.length % 2 !== 0) return false;
  return bytes === undefined ? v.length > 0 : v.length === bytes * 2;
}

/** 32-byte hex id normalised without prefix, or null. */
export function normaliseId32(value: string): string | null {
  const v = stripHexPrefix(value);
  return isHex(v, 32) ? v : null;
}

export function hexToBytes(hex: string): Uint8Array {
  const v = stripHexPrefix(hex);
  const out = new Uint8Array(v.length / 2);
  return out.map((_, i) => parseInt(v.slice(i * 2, i * 2 + 2), 16));
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** `abcd…1234` style shortening for ids and addresses. */
export function shortId(value: string, head = 8, tail = 6): string {
  const v = value.startsWith("0x") ? value.slice(2) : value;
  if (v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp("[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]");

/** Decode memo bytes to text when they look like UTF-8 text, else return null. */
export function hexToUtf8IfText(hex: string): string | null {
  try {
    const bytes = hexToBytes(hex);
    if (bytes.length === 0) return null;
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (CONTROL_CHARS.test(text)) return null;
    return text;
  } catch {
    return null;
  }
}
