/**
 * Last mempool summary of a tab, kept in localStorage so the next visit paints the projected
 * blocks at once and the sync (./sync.ts) is seeded with what is already known: a mempool item
 * never changes under its id, so only ids that arrived since are fetched (each one is a few
 * hundred KB of puzzle reveals). Bounded in items and age; the live id list decides what is
 * still pending, the snapshot never does.
 */
import type { CompactMempoolItem, MempoolSummary } from "./types";

export const SNAPSHOT_KEY_PREFIX = "mempool-xch:mempool-snapshot:v1:";
/** Highest fee rates first, i.e. the items that make the next projected blocks. */
export const SNAPSHOT_MAX_ITEMS = 300;
/** Older than this, hardly anything is still pending: not worth parsing. */
export const SNAPSHOT_MAX_AGE_MS = 60 * 60 * 1000;
/** Do not rewrite the snapshot more often than this. */
export const SNAPSHOT_MIN_GAP_MS = 15_000;

function isCompactItem(v: unknown): v is CompactMempoolItem {
  const i = v as CompactMempoolItem | null;
  return (
    !!i &&
    typeof i === "object" &&
    typeof i.id === "string" &&
    typeof i.fee === "string" &&
    typeof i.cost === "number" &&
    typeof i.feeRate === "number" &&
    typeof i.firstSeen === "number" &&
    typeof i.kind === "string" &&
    Array.isArray(i.additions) &&
    Array.isArray(i.removals) &&
    Array.isArray(i.assetIds) &&
    !!i.assets &&
    Array.isArray(i.assets.cats)
  );
}

export function loadSnapshot(
  storage: Pick<Storage, "getItem"> | null,
  network: string,
  now = Date.now()
): MempoolSummary | null {
  try {
    const raw = storage?.getItem(`${SNAPSHOT_KEY_PREFIX}${network}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MempoolSummary | null;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.network !== network ||
      typeof parsed.generatedAt !== "number" ||
      now - parsed.generatedAt > SNAPSHOT_MAX_AGE_MS ||
      !parsed.state ||
      typeof parsed.state.blockMaxCost !== "number" ||
      !Array.isArray(parsed.items)
    )
      return null;
    return { ...parsed, items: parsed.items.filter(isCompactItem) };
  } catch {
    return null;
  }
}

export function saveSnapshot(
  storage: Pick<Storage, "setItem" | "removeItem"> | null,
  summary: MempoolSummary
): void {
  const key = `${SNAPSHOT_KEY_PREFIX}${summary.network}`;
  try {
    const items =
      summary.items.length > SNAPSHOT_MAX_ITEMS
        ? [...summary.items].sort((a, b) => b.feeRate - a.feeRate).slice(0, SNAPSHOT_MAX_ITEMS)
        : summary.items;
    storage?.setItem(key, JSON.stringify({ ...summary, items }));
  } catch {
    // Quota or private mode: drop the old snapshot rather than keep a stale one around.
    try {
      storage?.removeItem(key);
    } catch {
      // Storage is unusable; the next visit simply starts cold.
    }
  }
}
