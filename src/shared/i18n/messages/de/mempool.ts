import type { Translation } from "../../translate";
import type en from "../en/mempool";

const messages: Translation<typeof en> = {
  title: "Mempool",
  viewAll: "Alle anzeigen →",
  spendBundles: "Spend Bundles",
  summarised: "{count} zusammengefasst",
  summarisedSyncing: "{count} zusammengefasst · synchronisiert",
  spendBundlesHint:
    "Vom Node gemeldete Anzahl. Holt die Zusammenfassung nach einem Neustart noch auf, ist die zusammengefasste Zahl für einige Sekunden niedriger.",
  costUsed: "Genutzte Kosten",
  costUsedHint:
    "Gesamte CLVM-Kosten aller ausstehenden Spend Bundles im Verhältnis zum Mempool-Limit des Nodes (10 Blöcke).",
  totalFees: "Gebühren gesamt",
  incoming: "Eingehend",
  perMinute: "{rate}/min",
  lastTenMinutes: "letzte 10 Minuten",
  incomingHint: "In den letzten zehn Minuten erstmals gesehene Spend Bundles, pro Minute.",
  chartLabel: "Mempool-Kosten nach Gebührenband im Zeitverlauf",
  feeBands: "Gebührenbänder",
  bandLabel: "{band} Mojo/Kosten",
  sampledSince: "In diesem Browser erfasst seit {time} (2-Stunden-Fenster)",
  historyStarts: "Der Verlauf beginnt, sobald die App zum ersten Mal geöffnet wird",
};

export default messages;
