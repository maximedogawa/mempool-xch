import type { Translation } from "../../translate";
import type en from "../en/nft";

const messages: Translation<typeof en> = {
  loading: "Wird geladen…",
  showMore: "Mehr anzeigen",
  untitled: "Ohne Titel",
  noAnswer: "MintGarden hat nicht geantwortet.",
  collectionsError: "Kollektionen konnten nicht geladen werden",
  activityError: "Aktivität konnte nicht geladen werden",
  mintsError: "Mints konnten nicht geladen werden",
  noRecentMints: "Keine neuen Mints.",
  home: {
    intro:
      "Kollektionen, Aktivität und Mints von MintGarden (nur Mainnet) sowie offene Offers von Dexie – auf Anfrage abgerufen, nichts wird auf unserem Server gespeichert. Die Zahlen unten beziehen sich auf die 6 Kollektionen mit dem höchsten 30-Tage-Volumen, nicht auf eine plattformweite Summe: Keiner der Anbieter veröffentlicht eine.",
    topVolume: "Top-Kollektionen, 30-T-Volumen",
    topVolumeHint: "Summe des 30-Tage-Handelsvolumens der 6 aktivsten Kollektionen.",
    topTrades: "Trades, Top-Kollektionen",
    recentActivity: "Letzte Aktivität",
    eventsShown: "unten angezeigte Ereignisse",
    recentMints: "Neue Mints",
    mintsShown: "unten angezeigte Mints",
    spotlight: "Kollektionen im Rampenlicht",
    allCollections: "Alle Kollektionen →",
    collectionAlt: "Kollektion",
    floor: "Floor {price}",
    noFloor: "kein Floor",
    noCollections: "Keine Kollektionsdaten verfügbar.",
    allActivity: "Alle Aktivitäten →",
    noActivity: "Keine aktuelle Aktivität.",
    newMints: "Neue Mints",
    allMints: "Alle Mints →",
    searchHint:
      "Sie haben eine NFT-ID oder eine Launcher-ID? Suchen Sie sie oben oder öffnen Sie <mono>{path}</mono> direkt.",
  },
  collections: {
    title: "NFT-Kollektionen",
    intro:
      "Sortiert nach Handelsvolumen im Zeitfenster, von MintGarden. Der Floor-Preis ist MintGardens eigenes günstigstes aktives Listing.",
    card: "Kollektionen",
    search: "Kollektionen suchen",
    window: "Zeitfenster",
    intervals: { d1: "24 h", d7: "7 T", d30: "30 T", all: "Gesamt" },
    noMatch: "Keine Kollektion passt zu „{query}“.",
    colCollection: "Kollektion",
    colItems: "Items",
    colFloor: "Floor",
    colVolume: "Volumen",
    colTrades: "Trades",
  },
  activity: {
    title: "NFT-Aktivität",
    intro:
      "Mints, Transfers, Verkäufe und Burns über alle von MintGarden indexierten Kollektionen, neueste zuerst.",
    card: "Aktivität",
    kind: "Art",
    kinds: { all: "Alle", mint: "Mints", transfer: "Transfers", trade: "Verkäufe", burn: "Burns" },
    noEvents: "Keine Ereignisse.",
  },
  mints: {
    title: "Neue Mints",
    intro:
      "Frisch gemintete NFTs aus allen von MintGarden indexierten Kollektionen, neueste zuerst.",
    card: "Mints",
  },
  event: {
    kinds: { mint: "Mint", transfer: "Transfer", trade: "Verkauf", burn: "Burn" },
    uncategorised: "Ohne Kollektion",
    block: "Block {height}",
  },
  offers: {
    title: "Offene Offers",
    titleCount: "Offene Offers ({count})",
    found: "gefunden {age}",
    copyOfferFile: "Offer-Datei kopieren",
    viewOnDexie: "Auf Dexie ansehen",
    none: "Derzeit keine offenen Offers auf Dexie.",
    howToAccept:
      "Um ein Offer anzunehmen, fügen Sie die Offer-Datei in Sage oder eine andere Chia-Wallet ein oder nehmen Sie es direkt auf Dexie an – diese App kann den Handel nicht für Sie einreichen; die App-Bridge von Sage bietet noch keine Möglichkeit, ein Offer anzunehmen.",
  },
  owned: {
    invalidTitle: "Keine gültige Adresse",
    invalidDescription:
      "Öffnen Sie die NFT-Anzahl auf einer Adress- oder DID-Seite, um deren Bestand anzusehen.",
    backToDid: "Zurück zur DID",
    backToAddress: "Zurück zur Adresse",
    title: "NFTs im Besitz",
    heldBy: "Gehalten von <owner></owner>",
    mainnetTitle: "Die NFT-Galerie ist im Mainnet verfügbar",
    mainnetDescription:
      "MintGarden liefert keine Testnet-Bestände. Die Adressübersicht zeigt weiterhin die NFT-Anzahl des Nodes.",
  },
};

export default messages;
