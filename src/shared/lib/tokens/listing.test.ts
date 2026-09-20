import { expect, test } from "bun:test";
import type { TokenInfo } from "@/shared/api/tokenList";
import { buildTokenRows, countByFilter, listTokens } from "./listing";
import type { TokenMarket } from "./markets";

const id = (n: number) => n.toString(16).padStart(64, "0");
const token = (n: number, name: string, liquidityXch: number | null = null): TokenInfo => ({
  assetId: id(n),
  name,
  symbol: name.slice(0, 3).toUpperCase(),
  iconUrl: null,
  website: null,
  description: null,
  liquidityXch,
});
const market = (n: number, price: number | null, d1: number, d7: number, d30: number) =>
  ({
    assetId: id(n),
    lastPriceXch: price,
    volumeXch: { d1, d7, d30 },
    bidXch: null,
    askXch: null,
    high30dXch: null,
    low30dXch: null,
  }) satisfies TokenMarket;

const rows = buildTokenRows(
  [token(1, "Busy", 50), token(2, "Monthly", 900), token(3, "Stale"), token(4, "Dormant")],
  {
    [id(1)]: market(1, 0.5, 10, 20, 30),
    [id(2)]: market(2, 2, 0, 0, 400),
    [id(3)]: market(3, 9, 0, 0, 0),
  }
);
const names = (list: ReturnType<typeof listTokens>) => list.map((r) => r.token.name);
const base = { filter: "all", sort: "volume", window: "d30", search: "" } as const;

test("volume ranks by XCH traded in the chosen window", () => {
  expect(names(listTokens(rows, base))).toEqual(["Monthly", "Busy", "Dormant", "Stale"]);
  expect(names(listTokens(rows, { ...base, window: "d1" }))[0]).toBe("Busy");
});

test("the traded filter follows the window", () => {
  expect(names(listTokens(rows, { ...base, filter: "traded" }))).toEqual(["Monthly", "Busy"]);
  expect(names(listTokens(rows, { ...base, filter: "traded", window: "d7" }))).toEqual(["Busy"]);
});

test("liquidity, price and name orders; priced and liquid filters", () => {
  expect(names(listTokens(rows, { ...base, sort: "liquidity", filter: "liquid" }))).toEqual([
    "Monthly",
    "Busy",
  ]);
  expect(names(listTokens(rows, { ...base, sort: "price", filter: "priced" }))).toEqual([
    "Stale",
    "Monthly",
    "Busy",
  ]);
  expect(names(listTokens(rows, { ...base, sort: "name" }))).toEqual([
    "Busy",
    "Dormant",
    "Monthly",
    "Stale",
  ]);
});

test("search matches name, ticker and asset id", () => {
  expect(names(listTokens(rows, { ...base, search: " dorm" }))).toEqual(["Dormant"]);
  expect(names(listTokens(rows, { ...base, search: "MON" }))).toEqual(["Monthly"]);
  expect(names(listTokens(rows, { ...base, search: `0x${id(3)}` }))).toEqual(["Stale"]);
});

test("counts per filter", () => {
  expect(countByFilter(rows, "d30")).toEqual({ traded: 2, liquid: 2, priced: 3, all: 4 });
});
