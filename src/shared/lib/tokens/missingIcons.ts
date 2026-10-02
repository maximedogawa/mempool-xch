/**
 * Icon URLs that failed to load, remembered for a day. Dexie answers a missing icon
 * (https://icons.dexie.space/<asset_id>.webp) with a 404 marked `cache-control: no-cache`, so
 * the browser would ask again every time that CAT's icon is rendered — on every page, list
 * refresh and row. Found icons are cached by the browser for three days; this is the same for
 * the missing ones: each is requested at most once per day, and every AssetIcon shares the answer.
 */
import { DEXIE_ICON_BASE } from "@/shared/api/tokenList";
import { browserStorage } from "@/shared/lib/browserStorage";

/**
 * Dexie's "no icon" answer is not an error an <img> can see: the 404 carries a plain grey
 * 500×500 PNG, which loads fine and would show as an empty disc. The host sends no CORS
 * headers, so the status cannot be read either; the size is what gives it away. Checked
 * 2026-09-24 against every listed CAT: real icons come as 512, 450, 120, 800 px and so on, and
 * exactly one of ~760 is 500×500 — that one shows the ticker badge instead, the rest of the
 * missing ones stop looking like a broken image.
 */
export function isDexiePlaceholder(url: string, width: number, height: number): boolean {
  return url.startsWith(`${DEXIE_ICON_BASE}/`) && width === 500 && height === 500;
}

export const MISSING_ICONS_KEY = "mempool-xch:missing-icons:v1";
export const MISSING_ICON_TTL_MS = 24 * 60 * 60 * 1000;
/** Bound the stored list; the oldest entries go first. */
export const MISSING_ICONS_MAX = 2000;

type Entries = Record<string, number>;

export function readMissingIcons(
  storage: Pick<Storage, "getItem"> | null,
  now = Date.now()
): Entries {
  try {
    const raw = storage?.getItem(MISSING_ICONS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries: Entries = {};
    for (const [url, at] of Object.entries(parsed)) {
      if (typeof at === "number" && now - at < MISSING_ICON_TTL_MS) entries[url] = at;
    }
    return entries;
  } catch {
    return {};
  }
}

export function writeMissingIcons(storage: Pick<Storage, "setItem"> | null, entries: Entries) {
  const kept = Object.entries(entries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MISSING_ICONS_MAX);
  try {
    storage?.setItem(MISSING_ICONS_KEY, JSON.stringify(Object.fromEntries(kept)));
  } catch {
    // Quota exceeded or storage unavailable: the in-memory copy still serves this session.
  }
}

let memory: Entries | null = null;
let version = 0;
const listeners = new Set<() => void>();

/** For useSyncExternalStore: every AssetIcon showing the same URL moves on together. */
export function subscribeMissingIcons(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function missingIconsVersion(): number {
  return version;
}

function entries(): Entries {
  memory ??= readMissingIcons(browserStorage());
  return memory;
}

export function isIconMissing(url: string, now = Date.now()): boolean {
  const at = entries()[url];
  return at !== undefined && now - at < MISSING_ICON_TTL_MS;
}

/**
 * Remember a failed icon. An image error cannot tell a 404 from a dropped connection, so while
 * the browser is offline the failure is kept for this session only, not stored for a day.
 */
export function markIconMissing(url: string, now = Date.now()): void {
  const all = entries();
  all[url] = now;
  version += 1;
  listeners.forEach((listener) => listener());
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  writeMissingIcons(browserStorage(), all);
}

/** Test hook: forget the in-memory copy so the next read goes back to storage. */
export function resetMissingIconsForTest(): void {
  memory = null;
}
