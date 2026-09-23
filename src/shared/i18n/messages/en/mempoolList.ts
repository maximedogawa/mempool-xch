/** The /mempool page: stats and the sortable list of pending bundles (src/widgets/mempoolList). */
const messages = {
  spendBundles: "Spend bundles",
  summarised: "{count} summarised",
  costUsed: "Cost used",
  costOf: "{used} of {max}",
  totalFees: "Total fees",
  updated: "Updated",
  source: {
    server: "summary API",
    snapshot: "from your last visit, syncing",
    syncing: "first sync in progress",
    node: "direct from node",
  },
  pendingTitle: "Pending spend bundles",
  updating: "updating…",
  live: "live",
  loadError: "Could not load the mempool",
  emptyTitle: "The mempool is empty",
  emptyDescription: "Every spend bundle has been included in a block.",
  columns: {
    txId: "Tx id",
    kind: "Kind",
    value: "Value",
    feeRate: "Fee / cost",
    fee: "Fee",
    cost: "Cost",
    age: "Age",
  },
  firstSeenTitle: "First observed by the mempoolxch.space server",
  showing: "Showing {shown} of {total}",
  showMore: "Show more",
};

export default messages;
