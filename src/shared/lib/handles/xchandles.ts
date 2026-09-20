/**
 * XCHandles, the Chia name registry behind xchandles.com: a handle such as "yakuhito" is a
 * registry slot that resolves to a name NFT, and that NFT's p2 puzzle hash is the address to
 * pay. api.xchandles.com is the authority and answers read-only JSON with CORS open to any
 * origin (docs.xchandles.com/api.md, verified 2026-09-20), so the browser asks it directly like
 * every other source in this app.
 *
 * Nothing here throws: a miss, an expired handle, an index that has fallen behind and a dead
 * network are all states the page renders, not errors it has to catch.
 */

export const XCHANDLES_API = "https://api.xchandles.com";

/** 3-63 lowercase ASCII letters and digits, with no normalisation, as the registry defines it. */
const HANDLE_RE = /^[a-z0-9]{3,63}$/;

export function isHandle(value: string): boolean {
  return HANDLE_RE.test(value);
}

/**
 * The handle inside a string a user typed, or null. Case is folded because a registry handle is
 * lowercase by definition, but nothing else is: an ".xch" name belongs to Namesdao, a different
 * registry, and must not be silently read as a handle.
 */
export function parseHandle(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  return isHandle(value) ? value : null;
}

export type HandleStatus =
  /** A live slot that resolves today. */
  | "active"
  /** The registry knew it and its term ran out. */
  | "expired"
  /** No slot for this handle: free to register. */
  | "unknown"
  /** The index is behind the chain; the answer would be a guess. */
  | "syncing"
  /** The registry could not be reached at all. */
  | "unavailable";

export interface HandleRecord {
  status: HandleStatus;
  handle: string;
  /** Unix seconds when the term ends; null when the registry has no slot to report. */
  expiration: number | null;
  /** Launcher id of the singleton that owns the slot (usually the name NFT itself). */
  ownerLauncherId: string | null;
  /** Launcher id the handle points at: the name NFT. */
  resolvedLauncherId: string | null;
  /** The name NFT's p2 puzzle hash — the address the handle resolves to. */
  p2PuzzleHash: string | null;
  registryLauncherId: string | null;
  /** How far the index had read the chain when it answered. */
  indexedPeakHeight: number | null;
}

export interface HandleResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}
export type HandleFetch = (url: string) => Promise<HandleResponse>;

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const hex = (v: unknown): string | null => {
  const s = str(v);
  return s ? s.toLowerCase().replace(/^0x/, "") : null;
};
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function empty(handle: string, status: HandleStatus): HandleRecord {
  return {
    status,
    handle,
    expiration: null,
    ownerLauncherId: null,
    resolvedLauncherId: null,
    p2PuzzleHash: null,
    registryLauncherId: null,
    indexedPeakHeight: null,
  };
}

function normalise(handle: string, status: HandleStatus, body: unknown): HandleRecord {
  const r = obj(body);
  const slot = obj(r.slot);
  const resolved = obj(r.resolved_singleton);
  const nft = obj(resolved.nft);
  const expiration = num(slot.expiration);
  return {
    // A slot whose term has already passed is expired however the registry labelled it.
    status:
      status === "active" && expiration !== null && expiration * 1000 <= Date.now()
        ? "expired"
        : status,
    handle,
    expiration,
    ownerLauncherId: hex(slot.owner_launcher_id),
    resolvedLauncherId: hex(slot.resolved_launcher_id) ?? hex(resolved.launcher_id),
    p2PuzzleHash: hex(nft.p2_puzzle_hash),
    registryLauncherId: hex(r.registry_launcher_id),
    indexedPeakHeight: num(r.indexed_peak_height),
  };
}

/**
 * Resolve a handle. An expired handle answers 410 with no detail, so it is asked again with
 * `bypass_expiration_safety_check`, which returns the slot as it stands: who held it and when it
 * ran out, which is exactly what the page wants to show. 503 means the index has fallen behind
 * the chain, and the registry would rather say so than answer from stale state.
 */
export async function fetchHandle(
  raw: string,
  fetchImpl: HandleFetch = fetch
): Promise<HandleRecord> {
  const handle = parseHandle(raw);
  if (!handle) return empty(raw.trim().toLowerCase(), "unknown");
  const ask = (query = "") =>
    fetchImpl(`${XCHANDLES_API}/handle/${encodeURIComponent(handle)}${query}`);
  try {
    const response = await ask();
    if (response.ok) return normalise(handle, "active", await response.json());
    if (response.status === 410) {
      const expired = await ask("?bypass_expiration_safety_check=true").catch(() => null);
      return expired?.ok
        ? { ...normalise(handle, "expired", await expired.json()), status: "expired" }
        : empty(handle, "expired");
    }
    if (response.status === 404 || response.status === 400) return empty(handle, "unknown");
    if (response.status === 503) return empty(handle, "syncing");
    return empty(handle, "unavailable");
  } catch {
    return empty(handle, "unavailable");
  }
}

export interface HandleRegistration {
  /** "register" when the handle was taken, "expire" when its term was collected. */
  actionKind: string;
  confirmationHeight: number | null;
  /** Mojos of the registry's payment CAT. */
  protocolFee: number | null;
}

/** The last confirmed register or expire action, or null when there is none to show. */
export async function fetchHandleRegistration(
  raw: string,
  fetchImpl: HandleFetch = fetch
): Promise<HandleRegistration | null> {
  const handle = parseHandle(raw);
  if (!handle) return null;
  try {
    const response = await fetchImpl(
      `${XCHANDLES_API}/registrations/${encodeURIComponent(handle)}`
    );
    if (!response.ok) return null;
    const r = obj(await response.json());
    const actionKind = str(r.action_kind);
    if (!actionKind) return null;
    return {
      actionKind,
      confirmationHeight: num(r.confirmation_height),
      protocolFee: num(r.protocol_fee),
    };
  } catch {
    return null;
  }
}

/** The handle's own page on xchandles.com. */
export function xchandlesUrl(handle: string): string {
  return `https://www.xchandles.com/handle/${encodeURIComponent(handle)}`;
}
