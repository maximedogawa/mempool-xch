/** Block timing card on the dashboard (src/widgets/blocktime). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Block time",
  hint: "Chia farms a block roughly every 18.75 seconds, but only about one in three carries transactions. The bar counts up to the expected gap between transaction blocks.",
  sinceLast: "Since last transaction block",
  expectedGap: "Expected gap",
  progressLabel: "Progress toward the expected next transaction block",
  avgBlock: "Avg block",
  seconds: "{seconds} s",
  txBlocks: "Tx blocks",
  observedGap: "Observed gap",
  netspace: "Netspace",
  pushedTitle: "Pushed by Coinset {age} · difficulty {difficulty}",
  fromState: "From get_blockchain_state",
  footer: {
    one: "Peak {peak} · last transaction block {last} · window of {count} block",
    other: "Peak {peak} · last transaction block {last} · window of {count} blocks",
  },
  reorgRecent: {
    one: "reorg {age} ({count} block at #{height})",
    other: "reorg {age} ({count} blocks at #{height})",
  },
  reorgLast: {
    one: "last reorg {age} ({count} block at #{height})",
    other: "last reorg {age} ({count} blocks at #{height})",
  },
};

export default defineNamespace("blocktime", messages);
