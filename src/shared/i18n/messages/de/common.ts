import type { Translation } from "../../translate";
import type en from "../en/common";

const messages: Translation<(typeof en)["messages"]> = {
  channel: {
    customName: "Polling",
    customDetail: "Prüft Ihren Node unter {host} alle paar Sekunden.",
    offlineName: "Offline",
    offlineDetail: "Keine Verbindung zu {host}.",
    socketName: "Live-Stream",
    socketDetail: "Live-Updates von {host}.",
    reconnectingName: "Live-Stream (verbindet neu)",
    reconnectingDetail: "Verbindet neu mit {host}.",
    nodexchSocketName: "Live-Stream",
    nodexchReconnectingName: "Live-Stream (verbindet neu)",
    pollingName: "Polling",
    pollingDetail: "Prüft {host} alle paar Sekunden.",
  },
  rpcError: {
    network:
      "Der Node ist nicht erreichbar. Prüfen Sie Ihre Verbindung oder den eingestellten Endpunkt.",
    http: "Der Node antwortete mit HTTP {status}.",
    httpUnknown: "Der Node antwortete mit einem HTTP-Fehler.",
    malformed: "Der Node lieferte eine Antwort, die nicht gelesen werden konnte.",
    notFound: "Nicht gefunden.",
    aborted: "Anfrage abgebrochen.",
  },
  assets: {
    nfts: { one: "{count} NFT", other: "{count} NFTs" },
    dids: { one: "{count} DID", other: "{count} DIDs" },
    singletons: { one: "{count} Singleton", other: "{count} Singletons" },
    poolClaims: { one: "{count} Pool-Claim", other: "{count} Pool-Claims" },
  },
  sensitivity: {
    title: "Sensibler Inhalt",
    summary: "{title}. Grund: {reason}",
  },
  pending: {
    broadcast: "An das Netzwerk gesendet, noch nicht im Mempool gesehen",
    waiting: "Im Mempool, hinter den voraussichtlichen Blöcken",
    nextBlock: "Nächster Block · Position {position} von {size}",
    projectedBlock: "Voraussichtlicher Block {block} · Position {position} von {size}",
    confirmed: "Bestätigt",
    gone: "In der Wallet nicht mehr ausstehend",
  },
  expiry: {
    lessThanDay: "weniger als einem Tag",
    days: { one: "{count} Tag", other: "{count} Tagen" },
    months: { one: "{count} Monat", other: "{count} Monaten" },
    years: { one: "{count} Jahr", other: "{count} Jahren" },
    ago: "vor {span}",
    in: "in {span}",
  },
  range: {
    all: "Alle",
  },
  smoothing: {
    raw: "Roh",
    smooth: "Geglättet",
    verySmooth: "Stark geglättet",
  },
  vaults: {
    coldUs: "Cold Wallet (USA)",
    coldCh: "Cold Wallet (Schweiz)",
    warmUs: "Warm Wallet (USA)",
    warmCh: "Warm Wallet (Schweiz)",
    custodyCold: "90 Tage Clawback, 30 Tage Auszahlungssperre",
    custodyWarm: "24 Stunden Clawback, 1 Stunde Auszahlungssperre",
  },
};

export default messages;
