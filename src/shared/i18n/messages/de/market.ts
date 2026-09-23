import type { Translation } from "../../translate";
import type en from "../en/market";

const messages: Translation<typeof en> = {
  title: "Markt",
  intro:
    "Ein Live-Schlachtfeld der XCH-Liquidität über öffentliche Orderbücher und Dexie-Offers hinweg. Die Marktdaten dienen nur zur Information und sind keine Finanzberatung.",
  quoteCurrency: "Quote-Währung",
  reduceMotion: "Bewegung reduzieren",
  disclaimer:
    "Kurse, Orderbücher und Ausführungen stammen direkt von Börsen Dritter und von Dexie und können verzögert, unvollständig oder falsch sein. Dies sind nur allgemeine Informationen, keine Finanz-, Anlage-, Steuer- oder Rechtsberatung und kein Angebot zum Kauf oder Verkauf. Siehe die <link>Nutzungsbedingungen</link>.",
  bestBid: "Bester Bid",
  bestAsk: "Bester Ask",
  onExchange: "bei {exchange}",
  noLiveBooks: "Keine Live-Orderbücher",
  crossSpread: "Börsenübergreifender Spread",
  crossedBooks: "Orderbücher überkreuzt",
  bidToAsk: "bester Bid bis bester Ask",
  midPrice: "Mittelkurs",
  midSub: "zwischen bestem Bid und Ask",
  sources: "Quellen",
  updated: "aktualisiert {time}",
  waiting: "wartet",
  unlistedNote:
    "{exchanges} listen XCH/{quote} nicht (geprüft am 23.09.2026), daher zeigt die {quote}-Ansicht nur {listed}.",
  battlefield: "Schlachtfeld",
  liveChart: "animiert",
  staticChart: "statisch",
  battlefieldIntro:
    "Käufer (Bids, links) und Verkäufer (Asks, rechts) aller Börsen stehen sich um den Mittelkurs gegenüber. Die gefüllte Fläche ist die gemeinsame Tiefe der Live-Orderbücher, die Linien sind die Tiefe jeder einzelnen Börse, die durchgezogenen Senkrechten die Frontlinie am besten Bid und Ask. Ausführungen schlagen als Treffer auf der Seite ein, die sie genommen haben.",
  chartSummary: "Tiefendiagramm aus {books} Live-Orderbüchern: bester Bid {bid}, bester Ask {ask}.",
  midLabel: "Mitte {price}",
  depthMax: "{amount} XCH",
  loadingBooks: "Orderbücher werden geladen …",
  legend: "Legende",
  legendBids: "Bids gesamt",
  legendAsks: "Asks gesamt",
  legendHits: "▲ letzte Ausführungen bei ihrem Preis",
  takerTitle: "Käufer gegen Verkäufer, letzte Stunde",
  buyers: "Käufer {share} %",
  sellers: "{share} % Verkäufer",
  takerBarLabel: "Taker-Käufe {buy} XCH, Taker-Verkäufe {sell} XCH",
  takerNote:
    "Taker-Volumen über die letzten Ausführungen, die jede Börse liefert (bis zu 30 je Börse), an lebhaften Tagen also nicht die volle Stunde.",
  fills: "Letzte Ausführungen",
  takerBuy: "Kauf",
  takerSell: "Verkauf",
  noFills: "Noch keine Ausführungen.",
  cexBooks: "CEX-Orderbücher",
  cexIntro:
    "Öffentliche XCH-Orderbücher von Gate, OKX und HTX, die Ihr Browser alle 5 Sekunden abruft, solange dieser Tab sichtbar ist.",
  live: "LIVE",
  stale: "VERALTET",
  lastUpdate: "zuletzt aktualisiert {time}",
  notYet: "noch keine Daten",
  staleNote:
    "Die letzte Anfrage ist fehlgeschlagen ({reason}). Das Orderbuch unten stammt von der letzten Aktualisierung und bleibt aus dem Aggregat; nächster Versuch um {retry}.",
  bid: "Bid",
  ask: "Ask",
  spread: "Spread",
  spreadPercent: "Spread %",
  bids: "Bids",
  asks: "Asks",
  amountPrice: "Menge · Preis",
  priceAmount: "Preis · Menge",
  sourceUnavailable: "Quelle nicht verfügbar",
  sourceExcluded: "Sie wird aus dem Aggregat ausgeschlossen, bis ein frisches Orderbuch eintrifft.",
  loadingBook: "Wird geladen …",
  dexTitle: "Dexie DEX · XCH / {asset}",
  dexieQuoteAsset: "Dexie-Quote-Asset",
  assetDescriptions: {
    byc: "Dezentraler USD-Stablecoin von Circuit",
    wusdcb: "USDC von warp.green, gebrückt von Base",
    wusdc: "USDC von warp.green, gebrückt von Ethereum",
    wusdt: "USDT von warp.green, gebrückt von Ethereum",
  },
  dexiePair: "Dexie-Paar",
  dexBid: "DEX-Bid",
  dexAsk: "DEX-Ask",
  dexSpread: "DEX-Spread",
  dexStatus: "DEX-Status",
  dexStatusSub: "beste offene Offers · {time}",
  dexStaleSub: "zuletzt aktualisiert {time} · {reason}",
  dexCexSpread: "DEX-Mitte gegen CEX-Mitte ({asset} gegen {quote})",
  dexCexPercent: "{percent} · DEX {dex} gegen CEX {cex}",
  waitingBoth: "Warten auf beide Seiten beider Märkte",
  likeForLike: "{asset} ist ein gewrappter {quote}, beide Seiten notieren also denselben Dollar.",
  pegAssumption:
    "{asset} und {quote} sind verschiedene USD-Stablecoins; der Vergleich setzt voraus, dass beide ihre Dollarbindung halten.",
  catNote:
    "Verwendeter Stablecoin-CAT: {label}, {description} (<link>{id}</link>). Die Kurse werden aus den Mengen jedes Offers berechnet, nur reine XCH-Offers eins zu eins.",
  howToRead: "So lesen Sie diese Seite",
  howToReadBody:
    "Käufer stehen Verkäufern um den Mittelkurs gegenüber. Der beste Bid ist der höchste Preis, den Käufer derzeit bieten; der beste Ask ist der niedrigste Verkaufspreis. Eine veraltete Quelle bleibt ausgegraut mit ihrer letzten Aktualisierung sichtbar und fließt nie in das börsenübergreifende Aggregat ein.",
  sourcesBody:
    "Quellen: die öffentlichen REST-APIs von {exchanges} (Orderbuch und letzte Trades) und die Offers-API von Dexie, alle direkt von Ihrem Browser abgefragt. MEXC, KuCoin und CoinEx listen XCH, ihre REST-APIs erlauben aber keine Browser-Anfragen; Binance und Bybit listen XCH nicht.",
  inspired:
    "Inspiriert vom Schlachtfeld-Layout auf <link>XCHMempool Battlefield</link>; Umsetzung und Gestaltung hier sind eigenständig.",
};

export default messages;
