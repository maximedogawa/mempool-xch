import type { Translation } from "../../translate";
import type en from "../en/status";

const messages: Translation<typeof en> = {
  title: "Status",
  tooltip:
    "Jetzt aus Ihrem Browser gemessen, auf dieselbe Weise, wie die Seiten ihre Daten laden. Es gibt keine serverseitige Überwachung und keinen Verlauf; eine rote Zeile bedeutet, dass Ihre Verbindung diesen Dienst gerade nicht erreicht.",
  health: {
    ok: "In Betrieb",
    degraded: "Eingeschränkt",
    down: "Nicht erreichbar",
    checking: "Wird geprüft",
  },
  overall: {
    ok: "Alle Dienste erreichbar",
    degraded: "Einige Dienste sind langsam oder eingeschränkt",
    down: "Einige Dienste sind nicht erreichbar",
  },
  checked: "geprüft {age} · erneute Prüfung jede Minute",
  checking: "wird geprüft…",
  checkAgain: "Erneut prüfen",
  services: "Dienste",
  serviceList: "Dienststatus",
  latency: "{ms} ms",
  names: {
    coinsetRpc: "Coinset Full-Node-RPC",
    ownNode: "Ihr Node (Full-Node-RPC)",
    indexed: "Coinset indexierte API",
    live: "Live-Stream",
    dns: "Chia-DNS-Introducer",
  },
  what: {
    noIndexed: "bei einem eigenen Node nicht verfügbar",
    pollingOnly: "nur Polling",
    viaDns: "über cloudflare-dns.com",
  },
  detail: {
    synced: "synchronisiert · Spitze #{height}",
    notSynced: "nicht synchronisiert · Spitze #{height}",
    lastReorg: "letzter Reorg {age}",
    answering: "antwortet",
    dexie: "Token-Verzeichnis antwortet",
    mintgarden: "NFT-API antwortet",
    seeder: { one: "{seeder}: {count} Node", other: "{seeder}: {count} Nodes" },
    geo: "Geolokalisierung antwortet",
    geoNoLocation: "antwortet ohne Standort",
  },
  live: {
    state: {
      live: "live",
      polling: "Polling",
      connecting: "verbindet",
      offline: "offline",
    },
    websocket: "{state} über WebSocket",
    viaPolling: "{state} per Polling",
    lastEvent: " · letztes Ereignis {age}",
    peak: " · Spitze #{height}",
  },
  footnote:
    "Die Website selbst ist eine statische App, ausgeliefert von mempoolxch.space (Health-Endpunkt <code>/up</code>); alles andere lädt Ihr Browser von den oben genannten Diensten. Coinset veröffentlicht seinen eigenen Status unabhängig von dieser Seite.",
};

export default messages;
