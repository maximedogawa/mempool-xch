import type { Translation } from "../../translate";
import type en from "../en/mempoolList";

const messages: Translation<(typeof en)["messages"]> = {
  spendBundles: "Spend Bundles",
  summarised: "{count} zusammengefasst",
  costUsed: "Genutzte Kosten",
  costOf: "{used} von {max}",
  totalFees: "Gebühren gesamt",
  updated: "Aktualisiert",
  source: {
    server: "Summary-API",
    snapshot: "von Ihrem letzten Besuch, wird synchronisiert",
    syncing: "erste Synchronisierung läuft",
    node: "direkt vom Node",
  },
  pendingTitle: "Ausstehende Spend Bundles",
  updating: "wird aktualisiert…",
  live: "Live",
  loadError: "Der Mempool konnte nicht geladen werden",
  emptyTitle: "Der Mempool ist leer",
  emptyDescription: "Jedes Spend Bundle wurde in einen Block aufgenommen.",
  columns: {
    txId: "Tx-ID",
    kind: "Art",
    value: "Wert",
    feeRate: "Gebühr / Kosten",
    fee: "Gebühr",
    cost: "Kosten",
    age: "Alter",
  },
  firstSeenTitle: "Zuerst vom mempoolxch.space-Server beobachtet",
  showing: "{shown} von {total} angezeigt",
  showMore: "Mehr anzeigen",
};

export default messages;
