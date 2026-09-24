import type { Translation } from "../../translate";
import type en from "../en/portfolio";

const messages: Translation<(typeof en)["messages"]> = {
  title: "Portfolio",
  intro:
    "Was Ihr Sage-Wallet und die Adressen auf Ihrer Beobachtungsliste halten und was es wert ist. Token-Preise sind Dexies letzter Handel in XCH, XCH/USD ist der Spotpreis von Gate.io; nichts verlässt Ihren Browser. Die 24-Stunden-Änderung zeigt, wie stark die eigene Kursbewegung von XCH den Wert verändert hat, da Token-Preise in XCH notiert sind.",
  sources: "Quelle",
  sourceAll: "Alle zusammen",
  sourceSage: "Sage-Wallet",
  emptyTitle: "Noch nichts anzuzeigen",
  emptyDescription:
    "Öffnen Sie mempoolxch.space im Sage-Wallet oder fügen Sie auf dem Dashboard eine Adresse zur Beobachtungsliste hinzu, dann erscheinen ihre Bestände hier.",
  toDashboard: "Zum Dashboard",
  watched: "Beobachtete Adressen · {count}",
  needsIndexed:
    "Adresssalden benötigen die indexierte API von Coinset, die der gewählte Node nicht anbietet.",
  loadError:
    "Einige Salden konnten nicht geladen werden. Die Zahlen sind möglicherweise unvollständig.",
  partial:
    "Nur die letzten {count} Sage-Transaktionen wurden gelesen, ein zuletzt früher bewegter Token kann daher fehlen.",
  total: "Gesamtwert",
  totalXch: "≈ {value} XCH",
  noUsd: "USD-Preis nicht verfügbar",
  changeHint:
    "Änderung des Werts über 24 Stunden durch die eigene Kursbewegung von XCH (Gate.io). Token-Preise sind in XCH notiert und bewegen sich daher mit.",
  stats: {
    assets: "Assets",
    assetsSub: "{priced} mit Preis",
    largest: "Größte Position",
    largestSub: "{share} des Werts",
    unpriced: "Ohne Preis",
    unpricedSub: "nicht in den Summen",
    unpricedNone: "jedes Asset hat einen Preis",
    xchShare: "XCH-Anteil",
    xchShareSub: "{value} XCH",
  },
  allocation: "Aufteilung",
  allocationLabel: "Aufteilung des Portfoliowerts nach Asset",
  allocationEmpty: "Noch keine Position hat einen Marktpreis, daher gibt es nichts aufzuteilen.",
  otherSlice: "Sonstige ({count})",
  holdings: "Bestände",
  holdingsCount: "{count} Assets",
  colAsset: "Asset",
  colPrice: "Preis",
  colAmount: "Bestand",
  colValue: "Wert",
  colShare: "Anteil",
  noPrice: "kein Preis",
  unknownToken: "Unbekannter Token",
  noHoldings: "Diese Quelle hält weder XCH noch Token.",
  unavailable: "Für diese Quelle konnten keine Salden geladen werden.",
};

export default messages;
