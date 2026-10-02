/**
 * Pure logic of the next-block goggles (src/widgets/goggles): filter state, matching, grouping,
 * layout, block statistics and keyboard neighbours. No React, no DOM, no network: unit tested
 * in model.test.ts. Amounts stay bigint mojos (fees) or plain cost numbers here; text is made
 * at the edge (./format.ts and the components).
 */
import { feeBandFor, FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import { primaryAsset } from "@/shared/lib/mempool/assets";
import type { CompactMempoolItem, TxKindHint } from "@/shared/lib/mempool/types";
import { squarify } from "@/shared/lib/treemap";

export const TX_KINDS: readonly TxKindHint[] = [
  "xch",
  "cat",
  "nft",
  "offer",
  "did",
  "pool",
  "singleton",
  "unknown",
];

/** Cost buckets (CLVM cost). A standard XCH spend is ~6–20M, a block holds 11B. */
export const SIZE_BUCKETS = [
  { id: "tiny", min: 0, max: 10_000_000 },
  { id: "small", min: 10_000_000, max: 50_000_000 },
  { id: "medium", min: 50_000_000, max: 250_000_000 },
  { id: "large", min: 250_000_000, max: 1_000_000_000 },
  { id: "huge", min: 1_000_000_000, max: Infinity },
] as const;
export type SizeBucketId = (typeof SIZE_BUCKETS)[number]["id"];

/** Time in the mempool, in milliseconds. */
export const AGE_BUCKETS = [
  { id: "min1", min: 0, max: 60_000 },
  { id: "min10", min: 60_000, max: 600_000 },
  { id: "hour1", min: 600_000, max: 3_600_000 },
  { id: "older", min: 3_600_000, max: Infinity },
] as const;
export type AgeBucketId = (typeof AGE_BUCKETS)[number]["id"];

export type OnlyFlag = "new" | "yours";
export type NonMatching = "dim" | "hide";
export type GroupBy = "none" | "fee" | "kind" | "asset";
export type ColourMode = "fee" | "kind";

export const GROUP_BYS: readonly GroupBy[] = ["none", "fee", "kind", "asset"];

export interface GogglesFilters {
  /** Asset kinds; empty = any. Several selected = any of them. */
  kinds: TxKindHint[];
  /** Asset keys (`cat:<asset id>`, `nft:<collection id>`); empty = any. */
  assets: string[];
  /** Inclusive fee-rate range in mojos per cost; null = open end. */
  feeMin: number | null;
  feeMax: number | null;
  sizes: SizeBucketId[];
  ages: AgeBucketId[];
  only: OnlyFlag[];
  /** Bundle id (prefix or part) or asset name, case-insensitive. */
  search: string;
}

export interface GogglesPrefs {
  filters: GogglesFilters;
  nonMatching: NonMatching;
  groupBy: GroupBy;
  colour: ColourMode;
}

export const EMPTY_FILTERS: GogglesFilters = {
  kinds: [],
  assets: [],
  feeMin: null,
  feeMax: null,
  sizes: [],
  ages: [],
  only: [],
  search: "",
};

export const DEFAULT_PREFS: GogglesPrefs = {
  filters: EMPTY_FILTERS,
  nonMatching: "dim",
  groupBy: "none",
  colour: "fee",
};

/* ------------------------------------------------------------------ persistence (validation) */

const MAX_SEARCH = 100;
const MAX_ASSETS = 50;

function pick<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is T => allowed.includes(v as T)))];
}

function rate(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** Anything read back from storage, made safe: unknown values fall back to the defaults. */
export function parsePrefs(raw: unknown): GogglesPrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const f = (r.filters && typeof r.filters === "object" ? r.filters : {}) as Record<
    string,
    unknown
  >;
  const assets = Array.isArray(f.assets)
    ? [
        ...new Set(
          f.assets.filter(
            (a): a is string => typeof a === "string" && /^(cat|nft):[\w-]{1,80}$/.test(a)
          )
        ),
      ].slice(0, MAX_ASSETS)
    : [];
  return {
    filters: {
      kinds: pick(f.kinds, TX_KINDS),
      assets,
      feeMin: rate(f.feeMin),
      feeMax: rate(f.feeMax),
      sizes: pick(
        f.sizes,
        SIZE_BUCKETS.map((b) => b.id)
      ),
      ages: pick(
        f.ages,
        AGE_BUCKETS.map((b) => b.id)
      ),
      only: pick(f.only, ["new", "yours"] as const),
      search: typeof f.search === "string" ? f.search.slice(0, MAX_SEARCH) : "",
    },
    nonMatching: r.nonMatching === "hide" ? "hide" : "dim",
    groupBy: GROUP_BYS.includes(r.groupBy as GroupBy) ? (r.groupBy as GroupBy) : "none",
    colour: r.colour === "kind" ? "kind" : "fee",
  };
}

/* ------------------------------------------------------------------------------- matching */

export function sizeBucketOf(cost: number): SizeBucketId {
  return (SIZE_BUCKETS.find((b) => cost >= b.min && cost < b.max) ?? SIZE_BUCKETS[0]).id;
}

export function ageBucketOf(ageMs: number): AgeBucketId {
  const age = Math.max(0, ageMs);
  return (AGE_BUCKETS.find((b) => age >= b.min && age < b.max) ?? AGE_BUCKETS[0]).id;
}

/** What the matcher needs to know beyond the item itself (all supplied by the widget). */
export interface MatchContext {
  now: number;
  isNew: (item: CompactMempoolItem) => boolean;
  isYours: (item: CompactMempoolItem) => boolean;
  /** Asset keys of the item (`cat:<id>` per CAT spent, `nft:<collection id>` when known). */
  assetKeys: (item: CompactMempoolItem) => string[];
  /** Human names the search box can find the item by (CAT name and ticker, NFT collection). */
  names: (item: CompactMempoolItem) => string[];
}

/** Normalised search text: lower case, trimmed, a leading 0x dropped. */
export function normaliseSearch(search: string): string {
  return search.trim().toLowerCase().replace(/^0x/, "");
}

export function isFiltering(filters: GogglesFilters): boolean {
  return activeChips(filters).length > 0;
}

/** Within one filter several values are alternatives (OR); different filters combine (AND). */
export function matchesFilters(
  item: CompactMempoolItem,
  filters: GogglesFilters,
  ctx: MatchContext
): boolean {
  if (filters.kinds.length > 0 && !filters.kinds.includes(item.kind)) return false;
  if (filters.feeMin !== null && item.feeRate < filters.feeMin) return false;
  if (filters.feeMax !== null && item.feeRate > filters.feeMax) return false;
  if (filters.sizes.length > 0 && !filters.sizes.includes(sizeBucketOf(item.cost))) return false;
  if (filters.ages.length > 0 && !filters.ages.includes(ageBucketOf(ctx.now - item.firstSeen)))
    return false;
  if (
    filters.only.length > 0 &&
    !filters.only.some((flag) => (flag === "new" ? ctx.isNew(item) : ctx.isYours(item)))
  )
    return false;
  if (filters.assets.length > 0) {
    const keys = ctx.assetKeys(item);
    if (!filters.assets.some((a) => keys.includes(a))) return false;
  }
  const query = normaliseSearch(filters.search);
  if (query) {
    const inId = item.id.toLowerCase().includes(query);
    if (!inId && !ctx.names(item).some((name) => name.toLowerCase().includes(query))) return false;
  }
  return true;
}

export interface MatchSummary {
  count: number;
  cost: number;
  /** Matched cost as a share of all the items' cost (0..1). */
  share: number;
}

export function summariseMatches(
  items: CompactMempoolItem[],
  matched: CompactMempoolItem[]
): MatchSummary {
  const total = items.reduce((s, i) => s + i.cost, 0);
  const cost = matched.reduce((s, i) => s + i.cost, 0);
  return { count: matched.length, cost, share: total > 0 ? cost / total : 0 };
}

/* ------------------------------------------------------------------------- filter chips */

export type FilterChip =
  | { type: "kind"; value: TxKindHint }
  | { type: "asset"; value: string }
  | { type: "fee"; min: number | null; max: number | null }
  | { type: "size"; value: SizeBucketId }
  | { type: "age"; value: AgeBucketId }
  | { type: "only"; value: OnlyFlag }
  | { type: "search"; value: string };

/** One removable chip per active filter value, in the order the filter bar shows them. */
export function activeChips(filters: GogglesFilters): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.search.trim()) chips.push({ type: "search", value: filters.search.trim() });
  filters.kinds.forEach((value) => chips.push({ type: "kind", value }));
  filters.assets.forEach((value) => chips.push({ type: "asset", value }));
  if (filters.feeMin !== null || filters.feeMax !== null)
    chips.push({ type: "fee", min: filters.feeMin, max: filters.feeMax });
  filters.sizes.forEach((value) => chips.push({ type: "size", value }));
  filters.ages.forEach((value) => chips.push({ type: "age", value }));
  filters.only.forEach((value) => chips.push({ type: "only", value }));
  return chips;
}

export function chipKey(chip: FilterChip): string {
  return chip.type === "fee" ? "fee" : `${chip.type}:${chip.value}`;
}

export function withoutChip(filters: GogglesFilters, chip: FilterChip): GogglesFilters {
  switch (chip.type) {
    case "search":
      return { ...filters, search: "" };
    case "kind":
      return { ...filters, kinds: filters.kinds.filter((v) => v !== chip.value) };
    case "asset":
      return { ...filters, assets: filters.assets.filter((v) => v !== chip.value) };
    case "fee":
      return { ...filters, feeMin: null, feeMax: null };
    case "size":
      return { ...filters, sizes: filters.sizes.filter((v) => v !== chip.value) };
    case "age":
      return { ...filters, ages: filters.ages.filter((v) => v !== chip.value) };
    case "only":
      return { ...filters, only: filters.only.filter((v) => v !== chip.value) };
  }
}

/** Add the value when absent, remove it when present. */
export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/* ------------------------------------------------------------------------------ assets */

/** CAT keys of every CAT the bundle spends, NFT collection keys where the collection is known. */
export function assetKeysOf(
  item: CompactMempoolItem,
  nftCollection: (launcherId: string) => string | null | undefined
): string[] {
  const keys = (item.assets?.cats ?? []).map((c) => `cat:${c.assetId}`);
  if (item.kind === "cat")
    item.assetIds.forEach((id) => !keys.includes(`cat:${id}`) && keys.push(`cat:${id}`));
  if (item.kind === "nft")
    item.assetIds.forEach((id) => {
      const collection = nftCollection(id);
      if (collection && !keys.includes(`nft:${collection}`)) keys.push(`nft:${collection}`);
    });
  return keys;
}

export interface AssetOption {
  key: string;
  count: number;
  cost: number;
}

/** Distinct specific assets in the block, heaviest first (the asset filter's options). */
export function assetOptions(
  items: CompactMempoolItem[],
  keysOf: (item: CompactMempoolItem) => string[]
): AssetOption[] {
  const acc = new Map<string, AssetOption>();
  items.forEach((item) =>
    keysOf(item).forEach((key) => {
      const entry = acc.get(key) ?? { key, count: 0, cost: 0 };
      acc.set(key, { key, count: entry.count + 1, cost: entry.cost + item.cost });
    })
  );
  return [...acc.values()].sort((a, b) => b.cost - a.cost || (a.key < b.key ? -1 : 1));
}

/* ----------------------------------------------------------------------------- grouping */

export interface ItemGroup {
  /** "all", a fee band id, a kind, or an asset key (`cat:…`, `nft:…`, `kind:<kind>`). */
  key: string;
  items: CompactMempoolItem[];
  cost: number;
}

/** Key of the one asset a bundle is "about", for grouping by asset. */
export function primaryAssetKey(
  item: CompactMempoolItem,
  nftCollection: (launcherId: string) => string | null | undefined
): string {
  const primary = primaryAsset(item.assets, item.kind);
  if (primary.kind === "cat" && primary.assetId) return `cat:${primary.assetId}`;
  if (item.kind === "nft" && item.assetIds[0]) {
    const collection = nftCollection(item.assetIds[0]);
    if (collection) return `nft:${collection}`;
  }
  return `kind:${primary.kind === "xch" ? item.kind : primary.kind}`;
}

export function groupItems(
  items: CompactMempoolItem[],
  groupBy: GroupBy,
  assetKey: (item: CompactMempoolItem) => string
): ItemGroup[] {
  if (groupBy === "none") {
    return items.length ? [{ key: "all", items, cost: items.reduce((s, i) => s + i.cost, 0) }] : [];
  }
  const keyOf = (item: CompactMempoolItem) =>
    groupBy === "fee"
      ? feeBandFor(item.feeRate).id
      : groupBy === "kind"
        ? item.kind
        : assetKey(item);
  const acc = new Map<string, ItemGroup>();
  items.forEach((item) => {
    const key = keyOf(item);
    const group = acc.get(key) ?? { key, items: [], cost: 0 };
    group.items.push(item);
    group.cost += item.cost;
    acc.set(key, group);
  });
  const groups = [...acc.values()];
  if (groupBy === "fee") {
    // Highest fee band first: the order the node fills a block in.
    const rank = (key: string) => FEE_BANDS.findIndex((b) => b.id === key);
    return groups.sort((a, b) => rank(b.key) - rank(a.key));
  }
  return groups.sort((a, b) => b.cost - a.cost || (a.key < b.key ? -1 : 1));
}

/* ------------------------------------------------------------------------------- layout */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TileLayout extends Rect {
  id: string;
  item: CompactMempoolItem;
  group: string;
}

export interface FrameLayout extends Rect {
  key: string;
}

export interface GogglesLayout {
  tiles: TileLayout[];
  /** Group outlines (only when grouping produced more than one group). */
  frames: FrameLayout[];
}

/** Gap between group frames, in pixels. */
const GROUP_GAP = 2;

/**
 * Nested squarified treemap inside `area`: groups first (kept in their given order for fee
 * bands, heaviest first otherwise), then each group's bundles by cost inside its rectangle.
 */
export function layoutGroups(groups: ItemGroup[], area: Rect, groupBy: GroupBy): GogglesLayout {
  const tiles: TileLayout[] = [];
  const frames: FrameLayout[] = [];
  if (groups.length === 0 || area.width <= 0 || area.height <= 0) return { tiles, frames };
  const place = (items: CompactMempoolItem[], rect: Rect, group: string) =>
    squarify(
      items.map((item) => ({ item, weight: item.cost })),
      rect.width,
      rect.height
    ).forEach((cell) =>
      tiles.push({
        id: cell.item.id,
        item: cell.item,
        group,
        x: rect.x + cell.x,
        y: rect.y + cell.y,
        width: cell.width,
        height: cell.height,
      })
    );
  if (groups.length === 1) {
    place(groups[0]!.items, area, groups[0]!.key);
    return { tiles, frames };
  }
  squarify(
    groups.map((group) => ({ item: group, weight: group.cost })),
    area.width,
    area.height,
    { order: groupBy === "fee" ? "input" : "weight" }
  ).forEach((cell) => {
    const rect: Rect = {
      x: area.x + cell.x + GROUP_GAP / 2,
      y: area.y + cell.y + GROUP_GAP / 2,
      width: Math.max(0, cell.width - GROUP_GAP),
      height: Math.max(0, cell.height - GROUP_GAP),
    };
    frames.push({ key: cell.item.key, ...rect });
    place(cell.item.items, rect, cell.item.key);
  });
  return { tiles, frames };
}

/** Lowest share of the canvas the fill takes, so a nearly empty block stays visible. */
export const MIN_FILL = 0.16;

/** Canvas height for a measured width: roomy on desktop, still tappable on a phone. */
export function canvasHeight(width: number): number {
  return Math.round(Math.min(300, Math.max(190, width * 0.3)));
}

/**
 * Where the tiles go: the block fills the canvas from the bottom up in proportion to the cost
 * shown, with the empty capacity above it.
 */
export function fillArea(width: number, height: number, cost: number, blockMaxCost: number): Rect {
  const fill = blockMaxCost > 0 ? Math.min(1, cost / blockMaxCost) : 0;
  const h = Math.round(height * Math.max(MIN_FILL, fill));
  return { x: 0, y: height - h, width, height: h };
}

/* -------------------------------------------------------------------------- block stats */

export interface KindShare {
  kind: TxKindHint;
  count: number;
  cost: number;
  /** Share of the block's cost, 0..1. */
  share: number;
}

/** Asset kinds in the block by share of cost, largest first. */
export function assetMix(items: CompactMempoolItem[]): KindShare[] {
  const total = items.reduce((s, i) => s + i.cost, 0);
  const acc = new Map<TxKindHint, KindShare>();
  items.forEach((item) => {
    const entry = acc.get(item.kind) ?? { kind: item.kind, count: 0, cost: 0, share: 0 };
    entry.count += 1;
    entry.cost += item.cost;
    acc.set(item.kind, entry);
  });
  return [...acc.values()]
    .map((e) => ({ ...e, share: total > 0 ? e.cost / total : 0 }))
    .sort((a, b) => b.cost - a.cost);
}

/** Per-kind counts, for the kind chips. */
export function kindCounts(items: CompactMempoolItem[]): Partial<Record<TxKindHint, number>> {
  const acc: Partial<Record<TxKindHint, number>> = {};
  items.forEach((i) => (acc[i.kind] = (acc[i.kind] ?? 0) + 1));
  return acc;
}

/** A bundle first observed after this tab's first live sync and within `freshMs` of now. */
export function isFreshItem(
  item: CompactMempoolItem,
  baseline: number | null,
  now: number,
  freshMs: number
): boolean {
  return baseline !== null && item.firstSeen > baseline && now - item.firstSeen < freshMs;
}

/**
 * A block was confirmed: the last transaction block moved forward and bundles that were in the
 * projected next block left the mempool with it.
 */
export function detectDeparture(
  previousIds: ReadonlySet<string>,
  currentIds: ReadonlySet<string>,
  previousTxHeight: number | null,
  currentTxHeight: number | null
): boolean {
  if (previousTxHeight === null || currentTxHeight === null) return false;
  if (currentTxHeight <= previousTxHeight) return false;
  for (const id of previousIds) if (!currentIds.has(id)) return true;
  return false;
}

/* ----------------------------------------------------------------- keyboard neighbours */

export type Direction = "left" | "right" | "up" | "down";

/**
 * The tile an arrow key moves to: the nearest tile whose centre lies beyond the current tile's
 * edge in that direction, preferring tiles in line with it. Null at the canvas edge.
 */
export function neighbourTile(
  tiles: readonly (Rect & { id: string })[],
  fromId: string,
  direction: Direction
): string | null {
  const from = tiles.find((t) => t.id === fromId);
  if (!from) return tiles[0]?.id ?? null;
  const cx = from.x + from.width / 2;
  const cy = from.y + from.height / 2;
  let best: { id: string; score: number } | null = null;
  tiles.forEach((tile) => {
    if (tile.id === fromId) return;
    const tx = tile.x + tile.width / 2;
    const ty = tile.y + tile.height / 2;
    const eps = 0.01;
    const ahead =
      direction === "right"
        ? tile.x >= from.x + from.width - eps
        : direction === "left"
          ? tile.x + tile.width <= from.x + eps
          : direction === "down"
            ? tile.y >= from.y + from.height - eps
            : tile.y + tile.height <= from.y + eps;
    if (!ahead) return;
    const along =
      direction === "left" || direction === "right" ? Math.abs(tx - cx) : Math.abs(ty - cy);
    // Overlap on the cross axis means "in line": no penalty for being off-centre then.
    const overlaps =
      direction === "left" || direction === "right"
        ? tile.y < from.y + from.height && tile.y + tile.height > from.y
        : tile.x < from.x + from.width && tile.x + tile.width > from.x;
    const across =
      direction === "left" || direction === "right" ? Math.abs(ty - cy) : Math.abs(tx - cx);
    const score = along + (overlaps ? across * 0.1 : across * 2 + 1_000);
    if (!best || score < best.score) best = { id: tile.id, score };
  });
  return (best as { id: string; score: number } | null)?.id ?? null;
}
