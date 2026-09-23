/** The token registry page (src/widgets/tokens). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Tokens",
  intro:
    "Every CAT the Dexie registry knows a name for, {total} in total. Price, volume and liquidity are Dexie market data, all in XCH so tokens compare with each other: volume is the XCH traded against the token, liquidity the XCH side of its open offers (refreshed daily). One request covers every token's market data, nothing kept on our server. On-chain history is on each token's page. Dollar figures use Gate.io's XCH/USD spot price. The 30-day range is the lowest and highest trade in XCH, the spread the gap between the best bid and ask. There is no market cap: no source the browser can reach publishes a token's circulating supply.",
  searchPlaceholder: "Search name, ticker or asset id",
  searchLabel: "Search tokens",
  show: "Show",
  period: "Period",
  sort: "Sort",
  windows: { d1: "24h", d7: "7d", d30: "30d" },
  filters: {
    traded: "Traded",
    tradedIn: "Traded in {window}",
    liquid: "With liquidity",
    priced: "Priced",
    all: "All",
  },
  sorts: { volume: "Volume", liquidity: "Liquidity", price: "Price", name: "Name" },
  marketsError: "Dexie market data is unavailable right now, so prices and volume are missing.",
  tryAgain: "Try again",
  registryError: "Could not load the token registry",
  noMatch: 'No token matches "{query}" in this view.',
  noTraded: {
    d1: "No token was traded in the last 24 hours.",
    d7: "No token was traded in the last 7 days.",
    d30: "No token was traded in the last 30 days.",
  },
  showAll: "Show all tokens",
  colToken: "Token",
  colPrice: "Price",
  colVolume: "Volume {window} (XCH)",
  colLiquidity: "Liquidity (XCH)",
  colRange: "30d range (XCH)",
  colSpread: "Spread",
  spreadHint:
    "Gap between the best bid and the best ask on Dexie, as a share of their midpoint. A wide spread means the last price says little about what the token would fetch.",
  range: "{from}–{to} of {total}",
  previous: "Previous",
  next: "Next",
};

export default defineNamespace("tokens", messages);
