import type { Translation } from "../../translate";
import type en from "../en/assets";

const messages: Translation<(typeof en)["messages"]> = {
  empty: "(leer)",
  coinsetNotice:
    "<b>Verlauf ohne Coinset nicht verfügbar:</b> {what}. Der konfigurierte Endpunkt ist ein eigener Node ohne indexierte API.",
  cat: {
    invalidTitle: "Keine gültige CAT-Asset-ID",
    invalidDescription: "Erwartet wird eine 32-Byte-Hex-Asset-ID. Erhalten: {raw}",
    title: "CAT-Token",
    iconAlt: "Token-Symbol",
    loading: "Token wird geladen…",
    notListed: "Nicht in Dexies Asset-Liste; nur anhand der Asset-ID angezeigt.",
    assetId: "Asset-ID",
    pendingTitle: "Ausstehende Transfers",
    pendingTitleCount: "Ausstehende Transfers ({count})",
    fromMempool: "aus dem Live-Mempool",
    noPending: "Keine ausstehenden Ausgaben dieses Tokens im Mempool.",
    colTxId: "Tx-ID",
    colFee: "Gebühr",
    colCost: "Kosten",
    colSeen: "Gesehen",
    recentTitle: "Letzte Transaktionen",
    loaded: "{count} geladen",
    noTransactions: "Für dieses Asset sind keine Transaktionen indexiert.",
    coinsetWhat: "Transaktionen nach CAT-Asset-ID sind eine indexierte Abfrage",
    offersTitle: "Offers mit diesem Token",
  },
  nft: {
    invalidTitle: "Keine gültige NFT-ID",
    invalidDescription:
      "Erwartet wird eine nft1…-ID oder eine 32-Byte-Launcher-ID. Erhalten: {raw}",
    imageAlt: "NFT-Bild",
    collection: "Kollektion: {name}",
    metadataMissing: "Metadaten von MintGarden nicht verfügbar.",
    mainnetOnly: "NFT-Metadaten gibt es nur im Mainnet.",
    nftId: "NFT-ID",
    launcherId: "Launcher-ID",
    currentOwner: "Aktueller Besitzer",
    unknown: "unbekannt",
    unknownNeedsCoinset: "unbekannt (erfordert Coinset)",
    currentCoin: "Aktueller Coin",
    lastMoved: "Zuletzt bewegt",
    royalty: "Lizenzgebühr",
    standard: "Standard",
    viewOnMintGarden: "Auf MintGarden ansehen",
    offerHistory: "Offer-Verlauf on-chain",
    transferHistory: "Transferverlauf",
    noTransfers: "Für dieses NFT sind keine Transfers indexiert.",
    coinsetWhat: "Transfers nach NFT-ID und der aktuelle Besitzer sind indexierte Abfragen",
  },
  txList: {
    incoming: "eingehend",
    outgoing: "ausgehend",
    self: "an sich selbst",
    loadError: "Transaktionen konnten nicht geladen werden",
    refreshError:
      "Transaktionen konnten nicht aktualisiert oder nachgeladen werden. Bitte versuchen Sie es erneut.",
    noNetChange: "keine Nettoänderung",
    fee: "Gebühr {amount}",
    pending: "ausstehend",
    loading: "Wird geladen…",
    loadMore: "Mehr laden",
  },
};

export default messages;
