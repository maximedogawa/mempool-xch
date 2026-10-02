/** Live transaction and block feeds on the dashboard (src/widgets/feed). */
import { defineNamespace } from "../../translate";

const messages = {
  latestTransactions: "Latest transactions",
  paused: "paused",
  mempoolLink: "Mempool →",
  empty: "The mempool is empty.",
  costTitle: "{cost} cost",
  zeroFee: "0 fee",
  feeRate: "{rate} m/c",
  firstSeenTitle:
    "First observed by the mempoolxch.space server (not the network's first-seen time)",
  latestBlocks: "Latest blocks",
  blocksLink: "Blocks →",
  txBlock: "tx block",
  noTx: "no tx",
};

export default defineNamespace("feed", messages);
