import type { Translation } from "../../translate";
import type en from "../en/market";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Markt",
  intro:
    "Ein Live-Schlachtfeld der XCH-Liquidität über öffentliche Orderbücher und Dexie-Offers hinweg. Die Marktdaten dienen nur zur Information und sind keine Finanzberatung.",
  quoteCurrency: "Quote-Währung",
  animate: "Animieren",
  reduceMotion: "Bewegung reduzieren",
  bestBid: "Bester Bid",
  bestAsk: "Bester Ask",
  exchangesLive: "{live}/3 Börsen live",
  noLiveBooks: "Keine Live-Orderbücher",
  crossSpread: "Börsenübergreifender Spread",
  bidToAsk: "bester Bid bis bester Ask",
  sources: "Quellen",
  updated: "aktualisiert {time}",
  waiting: "wartet",
  cexBooks: "CEX-Orderbücher",
  cexIntro: "Öffentliche XCH-Orderbücher von Gate, OKX und HTX.",
  live: "LIVE",
  stale: "VERALTET",
  notAvailable: "nicht verfügbar",
  bid: "Bid",
  ask: "Ask",
  spread: "Spread",
  bids: "Bids",
  asks: "Asks",
  amountPrice: "Menge · Preis",
  priceAmount: "Preis · Menge",
  sourceUnavailable: "Quelle nicht verfügbar",
  sourceExcluded: "Sie wird aus dem Aggregat ausgeschlossen, bis ein frisches Orderbuch eintrifft.",
  dexieQuoteAsset: "Dexie-Quote-Asset",
  assetDescriptions: {
    byc: "Dezentraler USD-Stablecoin von Circuit",
    wusdc: "USDC-CAT von warp.green",
  },
  dexiePair: "Dexie-Paar",
  dexBid: "DEX-Bid",
  dexAsk: "DEX-Ask",
  dexStatus: "DEX-Status",
  dexStatusSub: "Offene Offers, bester Preis",
  source: "Quelle",
  publicOffersApi: "Öffentliche Offers-API",
  dexCexSpread: "DEX/CEX-Spread",
  selectUsdc: "Zum Vergleich USDC wählen",
  differentQuote: "Anderes Quote-Asset; Vergleich deaktiviert",
  waitingBoth: "Warten auf beide Orderbücher",
  dexNote:
    "Dexie-Kurse sind Offers für {asset}. Sie sind nicht direkt mit {quote} vergleichbar, außer beide nutzen dasselbe Quote-Asset. Die CEX-Orderbücher oben sind in {quote}.",
  howToRead: "So lesen Sie diese Seite",
  howToReadBody:
    "Käufer stehen Verkäufern um den Mittelkurs gegenüber. Der beste Bid ist der höchste Preis, den Käufer derzeit bieten; der beste Ask ist der niedrigste Verkaufspreis. Eine veraltete Quelle bleibt mit ihrer letzten Aktualisierung sichtbar und fließt nie in das börsenübergreifende Aggregat ein.",
  inspired:
    "Inspiriert vom Schlachtfeld-Layout auf <link>XCHMempool Battlefield</link>; Umsetzung und Gestaltung hier sind eigenständig.",
  emptyBook: "Leeres Orderbuch",
  unavailable: "Nicht verfügbar",
};

export default messages;
