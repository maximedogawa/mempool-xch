/**
 * Dexie open offers between XCH and a USD stablecoin CAT, read as a DEX order book. Dexie's
 * `price` field is a float in whichever direction the offer was made (stablecoin per XCH for an
 * XCH sell, XCH per stablecoin for an XCH buy, e.g. 1.8099999999999998), so it is not used:
 * prices are recomputed from the offered and requested amounts in fixed point.
 */
import { divRound, PRICE_SCALE, parseScaled } from "./decimal";
import type { MarketLevel, MarketQuote } from "./orderbook";

export type DexQuoteAsset = "BYC" | "wUSDC.b" | "wUSDC" | "wUSDT";

export interface DexAssetInfo {
  assetId: string;
  label: string;
  /** Message key under market.assetDescriptions. */
  description: "byc" | "wusdcb" | "wusdc" | "wusdt";
  pairUrl: string;
  /** The CEX quote the stablecoin wraps, when it wraps one; BYC is its own USD stablecoin. */
  wraps: MarketQuote | null;
}

/** Stablecoin CATs with XCH markets on Dexie (ids from api.dexie.space/v1/swap/tokens). */
export const DEX_QUOTE_ASSETS: Record<DexQuoteAsset, DexAssetInfo> = {
  BYC: {
    assetId: "ae1536f56760e471ad85ead45f00d680ff9cca73b8cc3407be778f1c0c606eac",
    label: "ByteCash (BYC)",
    description: "byc",
    pairUrl: "https://dexie.space/offers/XCH/BYC",
    wraps: null,
  },
  "wUSDC.b": {
    assetId: "fa4a180ac326e67ea289b869e3448256f6af05721f7cf934cb9901baa6b7a99d",
    label: "wUSDC.b",
    description: "wusdcb",
    pairUrl: "https://dexie.space/offers/XCH/wUSDC.b",
    wraps: "USDC",
  },
  wUSDC: {
    assetId: "bbb51b246fbec1da1305be31dcf17151ccd0b8231a1ec306d7ce9f5b8c742b9e",
    label: "wUSDC",
    description: "wusdc",
    pairUrl: "https://dexie.space/offers/XCH/wUSDC",
    wraps: "USDC",
  },
  wUSDT: {
    assetId: "634f9f0de1a6c39a2189948b8e61b6852fbf774f73b0e36e143e841c49a0798c",
    label: "wUSDT",
    description: "wusdt",
    pairUrl: "https://dexie.space/offers/XCH/wUSDT",
    wraps: "USDT",
  },
};

export const DEX_QUOTE_ORDER: readonly DexQuoteAsset[] = ["BYC", "wUSDC.b", "wUSDC", "wUSDT"];

/** Offers fetched per side; the best few are enough for a best price and a little depth. */
export const DEX_PAGE_SIZE = 10;

const DEXIE_OFFERS = "https://api.dexie.space/v1/offers";

/**
 * Open offers selling XCH for the asset (asks) or buying XCH with it (bids). Dexie sorts by its
 * own `price`, which is quote per XCH for asks and XCH per quote for bids, so ascending is the
 * best-first order on both sides.
 */
export function dexieOffersUrl(asset: DexQuoteAsset, side: "asks" | "bids"): string {
  const id = DEX_QUOTE_ASSETS[asset].assetId;
  const [offered, requested] = side === "asks" ? ["xch", id] : [id, "xch"];
  return `${DEXIE_OFFERS}?status=0&page_size=${DEX_PAGE_SIZE}&compact=true&offered=${offered}&requested=${requested}&sort=price`;
}

const XCH_DECIMALS = 12;

interface DexieLeg {
  id?: unknown;
  amount?: unknown;
}

/** Amount of `id` in an offer leg list, scaled by 10^12 (XCH mojos; CAT amounts fit easily). */
function legAmount(legs: unknown, id: string): bigint | null {
  if (!Array.isArray(legs) || legs.length !== 1) return null;
  const leg = legs[0] as DexieLeg;
  if (leg?.id !== id) return null;
  const value = parseScaled(leg.amount, XCH_DECIMALS);
  return value !== null && value > 0n ? value : null;
}

/**
 * One side of the Dexie book as price levels (quote per XCH), best first. Only plain
 * one-for-one XCH/stablecoin offers count; bundles with other assets are skipped.
 */
export function parseDexieOffers(
  raw: unknown,
  asset: DexQuoteAsset,
  side: "asks" | "bids"
): MarketLevel[] {
  const offers = (raw as { offers?: unknown })?.offers;
  if (!Array.isArray(offers)) return [];
  const id = DEX_QUOTE_ASSETS[asset].assetId;
  const out: MarketLevel[] = [];
  for (const offer of offers as Array<{ offered?: unknown; requested?: unknown }>) {
    const xch = legAmount(side === "asks" ? offer?.offered : offer?.requested, "xch");
    const stable = legAmount(side === "asks" ? offer?.requested : offer?.offered, id);
    if (xch === null || stable === null) continue;
    out.push({ priceScaled: divRound(stable * PRICE_SCALE, xch), amount: Number(xch) / 1e12 });
  }
  return out.sort((a, b) => {
    if (a.priceScaled === b.priceScaled) return 0;
    return (side === "bids" ? b.priceScaled > a.priceScaled : a.priceScaled > b.priceScaled)
      ? 1
      : -1;
  });
}
