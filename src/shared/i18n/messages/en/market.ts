/** The market page: CEX order books and Dexie quotes (src/widgets/market). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Market",
  intro:
    "A live battlefield for XCH liquidity across public order books and Dexie offers. Market data is informational only, not financial advice.",
  quoteCurrency: "Quote currency",
  animate: "Animate",
  reduceMotion: "Reduce motion",
  bestBid: "Best bid",
  bestAsk: "Best ask",
  exchangesLive: "{live}/3 exchanges live",
  noLiveBooks: "No live books",
  crossSpread: "Cross spread",
  bidToAsk: "best bid to best ask",
  sources: "Sources",
  updated: "updated {time}",
  waiting: "waiting",
  cexBooks: "CEX order books",
  cexIntro: "Gate, OKX and HTX public XCH books.",
  live: "LIVE",
  stale: "STALE",
  notAvailable: "not available",
  bid: "Bid",
  ask: "Ask",
  spread: "Spread",
  bids: "Bids",
  asks: "Asks",
  amountPrice: "Amount · Price",
  priceAmount: "Price · Amount",
  sourceUnavailable: "Source unavailable",
  sourceExcluded: "It is excluded from the aggregate until a fresh book arrives.",
  dexieQuoteAsset: "Dexie quote asset",
  assetDescriptions: {
    byc: "Circuit decentralized USD stablecoin",
    wusdc: "warp.green USDC CAT",
  },
  dexiePair: "Dexie pair",
  dexBid: "DEX bid",
  dexAsk: "DEX ask",
  dexStatus: "DEX status",
  dexStatusSub: "Open offers, best price",
  source: "Source",
  publicOffersApi: "Public offers API",
  dexCexSpread: "DEX / CEX spread",
  selectUsdc: "Select USDC to compare",
  differentQuote: "Different quote asset; comparison disabled",
  waitingBoth: "Waiting for both books",
  dexNote:
    "Dexie quotes are offers for {asset}. They are not directly comparable with {quote} unless both use the same quote asset. CEX books above are {quote}.",
  howToRead: "How to read this",
  howToReadBody:
    "Buyers face sellers around the midpoint. Best bid is the highest price buyers currently show; best ask is the lowest seller price. A stale source stays visible with its last update and never affects the cross-exchange aggregate.",
  inspired:
    "Inspired by the battlefield layout on <link>XCHMempool Battlefield</link>; the implementation and visuals here are original.",
  emptyBook: "Empty order book",
  unavailable: "Unavailable",
};

export default defineNamespace("market", messages);
