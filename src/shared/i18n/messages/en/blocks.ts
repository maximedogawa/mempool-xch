/** Dashboard block row: projected and recent blocks, projected block details, reorgs (src/widgets/blocks). */
import { defineNamespace } from "../../translate";

const messages = {
  row: {
    label: "Blocks",
    projected: "Projected · next blocks",
    confirmed: "Confirmed · recent transaction blocks",
  },
  projected: {
    emptyLabel: "Mempool is empty: the next block will carry no transactions",
    empty: "Empty",
    mempool: "mempool",
    listLabel: "Projected next blocks",
    cubeLabel:
      "Projected block {n}: {bundles}{yours}{watched}, {percent}% full, fee rate {min} to {max} mojo per cost, {eta}",
    bundles: { one: "{count} spend bundle", other: "{count} spend bundles" },
    yoursPart: ", {count} of yours",
    watchedPart: ", {count} watched",
    nextBlock: "Next block",
    zeroFee: "0 fee",
    txCount: "{count} tx · {cost}",
    yours: "{count} yours",
    inEta: "In {eta}",
  },
  details: {
    title: "Projected block {n} · {bundles} · {cost} cost · {eta}",
    bundles: { one: "{count} spend bundle", other: "{count} spend bundles" },
    close: "Close",
    closeLabel: "Close projected block details",
    txId: "Tx id",
    kind: "Kind",
    fee: "Fee",
    cost: "Cost",
    feePerCost: "Fee / cost",
    value: "Value",
    seen: "Seen",
    showingFirst: "Showing the first {shown} of {total}. <link>Open the full mempool table</link>.",
  },
  recent: {
    listLabel: "Recent transaction blocks",
    cubeLabel: "Block {height}{watched}, {age}, fees {fees}, {farmer}",
    watchedPart: ", {count} watched",
    farmedByPool: "farmed by {pool}",
    farmerHash: "farmer {hash}",
    totalFees: "total fees",
    moved: "{amount} moved",
    rewardClaims: { one: "{count} reward claim", other: "{count} reward claims" },
    poolTitle: "{pool} · farmer {hash}",
    farmerTitle: "Farmer {hash}",
    gap: {
      one: "{count} non-transaction block between {newer} and {older} (they carry no spends)",
      other: "{count} non-transaction blocks between {newer} and {older} (they carry no spends)",
    },
    empty: "No transaction blocks in the recent window ({cost} cost each).",
  },
  reorgs: {
    title: "Reorg history",
    hint: "A reorg replaces the most recent block(s) with a competing chain. Chia reorgs are usually one block deep and harmless; a transaction in a reorged block is simply included again a block later.",
    mostRecent: "{count} most recent, as detected by Coinset",
    empty: "No reorgs recorded.",
    detected: "Detected",
    depth: "Depth",
    rolledBackTo: "Rolled back to",
    oldPeak: "Old peak",
    newPeak: "New peak",
    depthValue: { one: "{count} block", other: "{count} blocks" },
    from: "from #{height}",
  },
};

export default defineNamespace("blocks", messages);
