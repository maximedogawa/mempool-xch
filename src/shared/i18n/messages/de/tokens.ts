import type { Translation } from "../../translate";
import type en from "../en/tokens";

const messages: Translation<typeof en> = {
  title: "Token",
  intro:
    "Jeder CAT, für den die Dexie-Registry einen Namen kennt, insgesamt {total}. Preis, Volumen und Liquidität sind Dexie-Marktdaten, alle in XCH, damit sich Token miteinander vergleichen lassen: Das Volumen ist das gegen den Token gehandelte XCH, die Liquidität die XCH-Seite seiner offenen Offers (täglich aktualisiert). Eine einzige Anfrage liefert die Marktdaten aller Token, auf unserem Server wird nichts gespeichert. Den On-Chain-Verlauf finden Sie auf der Seite des jeweiligen Tokens.",
  searchPlaceholder: "Name, Ticker oder Asset-ID suchen",
  searchLabel: "Token suchen",
  show: "Anzeigen",
  period: "Zeitraum",
  sort: "Sortierung",
  windows: { d1: "24 h", d7: "7 T", d30: "30 T" },
  filters: {
    traded: "Gehandelt",
    tradedIn: "Gehandelt in {window}",
    liquid: "Mit Liquidität",
    priced: "Mit Preis",
    all: "Alle",
  },
  sorts: { volume: "Volumen", liquidity: "Liquidität", price: "Preis", name: "Name" },
  marketsError:
    "Die Dexie-Marktdaten sind gerade nicht verfügbar, daher fehlen Preise und Volumen.",
  tryAgain: "Erneut versuchen",
  registryError: "Die Token-Registry konnte nicht geladen werden",
  noMatch: "Kein Token in dieser Ansicht passt zu „{query}“.",
  noTraded: {
    d1: "In den letzten 24 Stunden wurde kein Token gehandelt.",
    d7: "In den letzten 7 Tagen wurde kein Token gehandelt.",
    d30: "In den letzten 30 Tagen wurde kein Token gehandelt.",
  },
  showAll: "Alle Token anzeigen",
  colToken: "Token",
  colPrice: "Preis (XCH)",
  colVolume: "Volumen {window} (XCH)",
  colLiquidity: "Liquidität (XCH)",
  range: "{from}–{to} von {total}",
  previous: "Zurück",
  next: "Weiter",
};

export default messages;
