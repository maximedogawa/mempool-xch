/** The portfolio page and the portfolio view on the wallet and address pages (src/widgets/portfolio). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Portfolio",
  intro:
    "What your Sage wallet and the addresses on your watchlist hold, and what it is worth. Token prices are Dexie's last trade in XCH, XCH/USD is Gate.io's spot price; nothing leaves your browser. The 24-hour change is how much XCH's own move changed the value, since token prices are quoted in XCH.",
  sources: "Source",
  sourceAll: "All combined",
  sourceSage: "Sage wallet",
  emptyTitle: "Nothing to show yet",
  emptyDescription:
    "Open mempoolxch.space inside the Sage wallet, or add an address to the watchlist on the dashboard, and its holdings appear here.",
  toDashboard: "Go to the dashboard",
  needsIndexed:
    "Address balances need Coinset's indexed API, which the selected node does not offer.",
  loadError: "Some balances could not be loaded. Figures may be incomplete.",
  partial:
    "Only the latest {count} Sage transactions were read, so a token last touched earlier may be missing.",
  total: "Total value",
  totalXch: "≈ {value} XCH",
  noUsd: "USD price unavailable",
  changeHint:
    "Change of the value over 24 hours through XCH's own price move (Gate.io). Token prices are quoted in XCH, so they move with it.",
  stats: {
    assets: "Assets",
    assetsSub: "{priced} with a price",
    largest: "Largest holding",
    largestSub: "{share} of the value",
    unpriced: "Without a price",
    unpricedSub: "not in the totals",
    unpricedNone: "every asset is priced",
    xchShare: "XCH share",
    xchShareSub: "{value} XCH",
  },
  allocation: "Allocation",
  allocationLabel: "Allocation of the portfolio value by asset",
  allocationEmpty: "No holding has a market price yet, so there is nothing to split.",
  otherSlice: "Other ({count})",
  holdings: "Holdings",
  holdingsCount: "{count} assets",
  colAsset: "Asset",
  colPrice: "Price",
  colAmount: "Holdings",
  colValue: "Value",
  colShare: "Allocation",
  noPrice: "no price",
  unknownToken: "Unknown token",
  noHoldings: "This source holds no XCH or tokens.",
};

export default defineNamespace("portfolio", messages);
