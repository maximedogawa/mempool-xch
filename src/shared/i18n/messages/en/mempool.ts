/** Mempool stats card and history chart on the dashboard (src/widgets/mempool). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Mempool",
  viewAll: "View all →",
  spendBundles: "Spend bundles",
  summarised: "{count} summarised",
  summarisedSyncing: "{count} summarised · syncing",
  spendBundlesHint:
    "Count reported by the node. When the summary is still catching up after a restart the summarised number is lower for a few seconds.",
  costUsed: "Cost used",
  costUsedHint:
    "Total CLVM cost of all pending spend bundles versus the node's mempool limit (10 blocks worth).",
  totalFees: "Total fees",
  incoming: "Incoming",
  perMinute: "{rate}/min",
  lastTenMinutes: "last 10 minutes",
  incomingHint: "Spend bundles first seen in the last ten minutes, per minute.",
  chartLabel: "Mempool cost by fee band over time",
  feeBands: "Fee bands",
  bandLabel: "{band} mojo/cost",
  sampledSince: "Sampled in this browser since {time} (2h window)",
  historyStarts: "History starts when the app is first opened",
};

export default defineNamespace("mempool", messages);
