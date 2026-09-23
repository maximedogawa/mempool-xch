import { describe, expect, test } from "bun:test";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import {
  activeChips,
  ageBucketOf,
  assetKeysOf,
  assetMix,
  assetOptions,
  canvasHeight,
  DEFAULT_PREFS,
  detectDeparture,
  EMPTY_FILTERS,
  fillArea,
  groupItems,
  isFiltering,
  isFreshItem,
  layoutGroups,
  matchesFilters,
  neighbourTile,
  parsePrefs,
  primaryAssetKey,
  sizeBucketOf,
  summariseMatches,
  toggle,
  withoutChip,
  type GogglesFilters,
  type MatchContext,
} from "./model";

const NOW = 1_800_000_000_000;
const CAT_A = "a".repeat(64);
const CAT_B = "b".repeat(64);
const LAUNCHER = "c".repeat(64);

function item(id: string, over: Partial<CompactMempoolItem> = {}): CompactMempoolItem {
  return {
    id: id.padEnd(64, "0"),
    fee: "0",
    cost: 10_000_000,
    feeRate: 0,
    spends: 1,
    additions: [],
    removals: [],
    additionCount: 1,
    removalCount: 1,
    assets: { xch: "1000000000000", cats: [], nfts: 0, dids: 0, singletons: 0 },
    firstSeen: NOW - 30_000,
    kind: "xch",
    assetIds: [],
    ...over,
  };
}

const xch = item("11", { feeRate: 0, cost: 6_000_000 });
const cat = item("22", {
  kind: "cat",
  feeRate: 6,
  cost: 60_000_000,
  assetIds: [CAT_A],
  assets: { xch: "0", cats: [{ assetId: CAT_A, amount: "5000" }], nfts: 0, dids: 0, singletons: 0 },
  firstSeen: NOW - 20 * 60_000,
});
const nft = item("33", {
  kind: "nft",
  feeRate: 1.5,
  cost: 400_000_000,
  assetIds: [LAUNCHER],
  assets: { xch: "1", cats: [], nfts: 1, dids: 0, singletons: 0 },
  firstSeen: NOW - 2 * 3_600_000,
});
const offer = item("44", {
  kind: "offer",
  feeRate: 30,
  cost: 30_000_000,
  assets: {
    xch: "5",
    cats: [
      { assetId: CAT_B, amount: "10" },
      { assetId: CAT_A, amount: "1" },
    ],
    nfts: 0,
    dids: 0,
    singletons: 0,
  },
});
const all = [xch, cat, nft, offer];

const collections: Record<string, string> = { [LAUNCHER]: "col1apes" };
const ctx: MatchContext = {
  now: NOW,
  isNew: (i) => i === offer,
  isYours: (i) => i === xch,
  assetKeys: (i) => assetKeysOf(i, (l) => collections[l]),
  names: (i) => (i === cat ? ["Spacebucks", "SBX"] : i === nft ? ["Chia Apes", "Ape #1"] : []),
};
const run = (filters: Partial<GogglesFilters>) =>
  all
    .filter((i) => matchesFilters(i, { ...EMPTY_FILTERS, ...filters }, ctx))
    .map((i) => i.id.slice(0, 2));

describe("matchesFilters", () => {
  test("no filters match everything", () => {
    expect(run({})).toEqual(["11", "22", "33", "44"]);
    expect(isFiltering(EMPTY_FILTERS)).toBe(false);
  });
  test("several kinds are alternatives", () => {
    expect(run({ kinds: ["cat", "nft"] })).toEqual(["22", "33"]);
  });
  test("different filters combine", () => {
    expect(run({ kinds: ["cat", "nft", "offer"], feeMin: 2 })).toEqual(["22", "44"]);
    expect(run({ kinds: ["cat", "nft", "offer"], feeMin: 2, feeMax: 10 })).toEqual(["22"]);
    expect(run({ kinds: ["xch"], only: ["new"] })).toEqual([]);
  });
  test("fee-rate bounds are inclusive", () => {
    expect(run({ feeMin: 6, feeMax: 6 })).toEqual(["22"]);
  });
  test("size and age buckets", () => {
    expect(run({ sizes: ["tiny"] })).toEqual(["11"]);
    expect(run({ sizes: ["medium", "large"] })).toEqual(["22", "33"]);
    expect(run({ ages: ["min1"] })).toEqual(["11", "44"]);
    expect(run({ ages: ["min10", "hour1"] })).toEqual(["22"]);
    expect(run({ ages: ["older"] })).toEqual(["33"]);
  });
  test("new and yours are alternatives", () => {
    expect(run({ only: ["new"] })).toEqual(["44"]);
    expect(run({ only: ["new", "yours"] })).toEqual(["11", "44"]);
  });
  test("specific assets match any CAT spent and known NFT collections", () => {
    expect(run({ assets: [`cat:${CAT_A}`] })).toEqual(["22", "44"]);
    expect(run({ assets: [`cat:${CAT_B}`] })).toEqual(["44"]);
    expect(run({ assets: ["nft:col1apes"] })).toEqual(["33"]);
  });
  test("search finds bundle ids (with or without 0x) and asset names, case-insensitive", () => {
    expect(run({ search: "  0x33" })).toEqual(["33"]);
    expect(run({ search: "sbx" })).toEqual(["22"]);
    expect(run({ search: "APES" })).toEqual(["33"]);
    expect(run({ search: "zzz" })).toEqual([]);
  });
});

describe("filter chips", () => {
  const filters: GogglesFilters = {
    kinds: ["cat", "nft"],
    assets: [`cat:${CAT_A}`],
    feeMin: 1,
    feeMax: null,
    sizes: ["huge"],
    ages: ["older"],
    only: ["yours"],
    search: " ape ",
  };
  test("one removable chip per active value", () => {
    const chips = activeChips(filters);
    expect(chips.map((c) => c.type)).toEqual([
      "search",
      "kind",
      "kind",
      "asset",
      "fee",
      "size",
      "age",
      "only",
    ]);
    expect(chips[0]).toEqual({ type: "search", value: "ape" });
    expect(isFiltering(filters)).toBe(true);
  });
  test("removing each chip in turn clears every filter", () => {
    let current = filters;
    activeChips(filters).forEach((chip) => (current = withoutChip(current, chip)));
    expect(current).toEqual(EMPTY_FILTERS);
  });
  test("toggle adds and removes", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("parsePrefs", () => {
  test("round-trips valid preferences", () => {
    const prefs = {
      filters: { ...EMPTY_FILTERS, kinds: ["cat" as const], feeMin: 0.5, search: "abc" },
      nonMatching: "hide" as const,
      groupBy: "asset" as const,
      colour: "kind" as const,
    };
    expect(parsePrefs(JSON.parse(JSON.stringify(prefs)))).toEqual(prefs);
  });
  test("drops unknown and malformed values", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("x")).toEqual(DEFAULT_PREFS);
    const parsed = parsePrefs({
      filters: {
        kinds: ["cat", "bogus", "cat"],
        assets: ["cat:abc", "<script>", 5],
        feeMin: -1,
        feeMax: "3",
        sizes: ["huge", "enormous"],
        ages: "older",
        only: ["new", "mine"],
        search: "x".repeat(500),
      },
      nonMatching: "explode",
      groupBy: "colour",
      colour: 7,
    });
    expect(parsed.filters.kinds).toEqual(["cat"]);
    expect(parsed.filters.assets).toEqual(["cat:abc"]);
    expect(parsed.filters.feeMin).toBeNull();
    expect(parsed.filters.feeMax).toBeNull();
    expect(parsed.filters.sizes).toEqual(["huge"]);
    expect(parsed.filters.ages).toEqual([]);
    expect(parsed.filters.only).toEqual(["new"]);
    expect(parsed.filters.search.length).toBe(100);
    expect(parsed.nonMatching).toBe("dim");
    expect(parsed.groupBy).toBe("none");
    expect(parsed.colour).toBe("fee");
  });
});

describe("buckets", () => {
  test("size buckets by cost", () => {
    expect(sizeBucketOf(0)).toBe("tiny");
    expect(sizeBucketOf(9_999_999)).toBe("tiny");
    expect(sizeBucketOf(10_000_000)).toBe("small");
    expect(sizeBucketOf(11_000_000_000)).toBe("huge");
  });
  test("age buckets by time in the mempool", () => {
    expect(ageBucketOf(-5)).toBe("min1");
    expect(ageBucketOf(60_000)).toBe("min10");
    expect(ageBucketOf(3_600_000)).toBe("older");
  });
});

describe("assets and grouping", () => {
  const keyOf = (i: CompactMempoolItem) => primaryAssetKey(i, (l) => collections[l]);
  test("asset keys and options", () => {
    expect(ctx.assetKeys(offer)).toEqual([`cat:${CAT_B}`, `cat:${CAT_A}`]);
    expect(ctx.assetKeys(nft)).toEqual(["nft:col1apes"]);
    expect(ctx.assetKeys(xch)).toEqual([]);
    const options = assetOptions(all, ctx.assetKeys);
    expect(options.map((o) => o.key)).toEqual(["nft:col1apes", `cat:${CAT_A}`, `cat:${CAT_B}`]);
    expect(options[1]).toEqual({ key: `cat:${CAT_A}`, count: 2, cost: 90_000_000 });
  });
  test("primary asset key", () => {
    expect(keyOf(cat)).toBe(`cat:${CAT_A}`);
    expect(keyOf(offer)).toBe(`cat:${CAT_B}`);
    expect(keyOf(nft)).toBe("nft:col1apes");
    expect(keyOf(item("55", { kind: "nft", assetIds: ["d".repeat(64)] }))).toBe("kind:nft");
    expect(keyOf(xch)).toBe("kind:xch");
  });
  test("group by none, fee band, kind and asset", () => {
    expect(groupItems([], "none", keyOf)).toEqual([]);
    expect(groupItems(all, "none", keyOf)[0]!.items.length).toBe(4);
    expect(groupItems(all, "fee", keyOf).map((g) => g.key)).toEqual([
      "very-high",
      "high",
      "mid",
      "zero",
    ]);
    const byKind = groupItems(all, "kind", keyOf);
    expect(byKind.map((g) => g.key)).toEqual(["nft", "cat", "offer", "xch"]);
    expect(byKind[0]!.cost).toBe(400_000_000);
    expect(groupItems([...all, cat], "asset", keyOf).map((g) => g.key)).toEqual([
      "nft:col1apes",
      `cat:${CAT_A}`,
      `cat:${CAT_B}`,
      "kind:xch",
    ]);
  });
});

describe("layout", () => {
  const area = { x: 0, y: 100, width: 600, height: 200 };
  const keyOf = (i: CompactMempoolItem) => primaryAssetKey(i, () => undefined);
  test("one group fills the area with one tile per bundle, no frames", () => {
    const { tiles, frames } = layoutGroups(groupItems(all, "none", keyOf), area, "none");
    expect(frames).toEqual([]);
    expect(tiles.length).toBe(4);
    const covered = tiles.reduce((s, t) => s + t.width * t.height, 0);
    expect(covered).toBeCloseTo(600 * 200, 3);
    tiles.forEach((t) => {
      expect(t.y).toBeGreaterThanOrEqual(100 - 1e-6);
      expect(t.y + t.height).toBeLessThanOrEqual(300 + 1e-6);
    });
  });
  test("groups get a frame each and their tiles stay inside it", () => {
    const { tiles, frames } = layoutGroups(groupItems(all, "kind", keyOf), area, "kind");
    expect(frames.map((f) => f.key).sort()).toEqual(["cat", "nft", "offer", "xch"]);
    tiles.forEach((t) => {
      const frame = frames.find((f) => f.key === t.group)!;
      expect(t.x).toBeGreaterThanOrEqual(frame.x - 1e-6);
      expect(t.x + t.width).toBeLessThanOrEqual(frame.x + frame.width + 1e-6);
      expect(t.y + t.height).toBeLessThanOrEqual(frame.y + frame.height + 1e-6);
    });
  });
  test("empty input or area gives nothing", () => {
    expect(layoutGroups([], area, "none").tiles).toEqual([]);
    expect(
      layoutGroups(groupItems(all, "none", keyOf), { ...area, width: 0 }, "none").tiles
    ).toEqual([]);
  });
  test("fill area grows from the bottom with a visible minimum", () => {
    expect(fillArea(800, 200, 0, 11e9)).toEqual({ x: 0, y: 168, width: 800, height: 32 });
    expect(fillArea(800, 200, 5.5e9, 11e9)).toEqual({ x: 0, y: 100, width: 800, height: 100 });
    expect(fillArea(800, 200, 20e9, 11e9).height).toBe(200);
    expect(canvasHeight(320)).toBe(190);
    expect(canvasHeight(2000)).toBe(300);
  });
  test("a full block of 1,000 bundles lays out quickly", () => {
    const many = Array.from({ length: 1000 }, (_, i) =>
      item(String(i), { cost: 1_000_000 + ((i * 7919) % 30_000_000), kind: i % 3 ? "xch" : "cat" })
    );
    const started = performance.now();
    const { tiles } = layoutGroups(groupItems(many, "kind", keyOf), area, "kind");
    expect(performance.now() - started).toBeLessThan(100);
    expect(tiles.length).toBe(1000);
  });
});

describe("block statistics and state", () => {
  test("asset mix by share of cost", () => {
    const mix = assetMix(all);
    expect(mix.map((m) => m.kind)).toEqual(["nft", "cat", "offer", "xch"]);
    expect(mix.reduce((s, m) => s + m.share, 0)).toBeCloseTo(1, 6);
  });
  test("match summary", () => {
    expect(summariseMatches(all, [cat, offer])).toEqual({
      count: 2,
      cost: 90_000_000,
      share: 90_000_000 / 496_000_000,
    });
    expect(summariseMatches([], []).share).toBe(0);
  });
  test("fresh items", () => {
    expect(isFreshItem(offer, null, NOW, 90_000)).toBe(false);
    expect(isFreshItem(offer, NOW - 60_000, NOW, 90_000)).toBe(true);
    expect(isFreshItem(offer, NOW - 10_000, NOW, 90_000)).toBe(false);
    expect(isFreshItem(offer, NOW - 60_000, NOW + 100_000, 90_000)).toBe(false);
  });
  test("departure needs a newer transaction block and a bundle gone", () => {
    const a = new Set(["a", "b"]);
    expect(detectDeparture(a, new Set(["b"]), 10, 11)).toBe(true);
    expect(detectDeparture(a, new Set(["a", "b", "c"]), 10, 11)).toBe(false);
    expect(detectDeparture(a, new Set(["b"]), 10, 10)).toBe(false);
    expect(detectDeparture(a, new Set(["b"]), null, 11)).toBe(false);
  });
});

describe("neighbourTile", () => {
  // a b
  // c d
  //  e
  const tiles = [
    { id: "a", x: 0, y: 0, width: 50, height: 50 },
    { id: "b", x: 50, y: 0, width: 50, height: 50 },
    { id: "c", x: 0, y: 50, width: 50, height: 50 },
    { id: "d", x: 50, y: 50, width: 50, height: 50 },
    { id: "e", x: 0, y: 100, width: 100, height: 20 },
  ];
  test("moves in each direction and stops at the edge", () => {
    expect(neighbourTile(tiles, "a", "right")).toBe("b");
    expect(neighbourTile(tiles, "a", "down")).toBe("c");
    expect(neighbourTile(tiles, "d", "left")).toBe("c");
    expect(neighbourTile(tiles, "d", "up")).toBe("b");
    expect(neighbourTile(tiles, "d", "down")).toBe("e");
    expect(neighbourTile(tiles, "e", "up")).not.toBeNull();
    expect(neighbourTile(tiles, "b", "right")).toBeNull();
    expect(neighbourTile(tiles, "a", "up")).toBeNull();
  });
  test("an unknown start falls back to the first tile", () => {
    expect(neighbourTile(tiles, "zz", "right")).toBe("a");
    expect(neighbourTile([], "zz", "right")).toBeNull();
  });
});
