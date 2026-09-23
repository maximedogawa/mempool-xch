/** Transaction detail page, coin flow diagram and cost verdict (src/widgets/tx). */
const messages = {
  heading: "Transaction",
  retry: "Retry",
  notAvailable: "n/a",
  unknown: "unknown",
  noId: {
    title: "No transaction id",
    description: "Open a transaction from the dashboard or paste an id into the search box.",
  },
  loadError: "Could not load the transaction",
  notFound: {
    title: "Transaction not found",
    coinset:
      "No pending spend bundle with this id is in the mempool and Coinset has no confirmed or dropped transaction with it. Spend bundles that were dropped from the mempool without confirming are not retained by nodes, so they cannot be shown.",
    customNode:
      "No pending spend bundle with this id is in the mempool. Spend bundles that were dropped from the mempool without confirming are not retained by nodes, so they cannot be shown. Confirmed transaction lookups need a Coinset endpoint; with a custom node, search the coin ids instead.",
  },
  pendingInIndex:
    "Pending in the index. Waiting for the node to provide the spend bundle; checking every 10 seconds.",
  rawJson: {
    show: "Show raw JSON",
    hide: "Hide raw JSON",
    spendBundle: "Spend bundle",
    summary: "Transaction summary",
  },
  memos: {
    title: "Memos ({count})",
    binary: "binary memo (likely a hint or puzzle hash)",
  },
  event: {
    title: "Event {n}",
    via: "via {protocol}",
    participant: "Participant",
    sent: "Sent",
    received: "Received",
    moreParticipants: {
      one: "…and {count} more participant (see raw JSON).",
      other: "…and {count} more participants (see raw JSON).",
    },
    leg: "Leg {n}",
    legSent: "sent",
    legReceived: "received",
    minted: "Minted {type} <asset></asset>",
    melted: "Melted {type} <asset></asset>",
  },
  summary: {
    title: "Summary",
    hint: "Semantic interpretation provided by the Coinset indexer: who sent and received which assets.",
    noEvents: "No semantic events for this transaction.",
  },
  stats: {
    fee: "Fee",
    zeroFeeSpend: "0-fee spend",
    cost: "Cost",
    clvmCost: "{cost} CLVM cost",
    costHint: "Total CLVM cost of the spend bundle; blocks hold 11B cost.",
    feePerCost: "Fee / cost",
    mojoPerCost: "mojo per cost",
    projectedBlock: "Projected block",
    projectedPosition: "{eta} · position {position} of {total}",
    notInSummary: "not in the summarised mempool yet",
    projectedHint:
      "Where this bundle lands when the mempool is packed by fee per cost into 11B-cost blocks.",
    block: "Block",
    dropped: "Dropped",
    confirmations: {
      one: "{count} confirmation",
      other: "{count} confirmations",
    },
    removedFromMempool: "removed from the mempool",
    time: "Time",
    feeRate: "{rate} mojo / cost",
    inferredCost: "inferred from chain (no cost recorded)",
    verdict: "Verdict",
  },
  pending: {
    line: "{coinSpends} · {removals} removals → {additions} additions · spends <amount></amount><assets></assets> · updates live; refreshes every 10 s while pending.",
    coinSpends: {
      one: "{count} coin spend",
      other: "{count} coin spends",
    },
    assets: {
      one: "asset",
      other: "assets",
    },
  },
  farmedBy: {
    line: "Farmed by <who></who> · <link>block details</link>",
    soloFarmer: "an unidentified solo farmer",
    unidentifiedPool: "an unidentified pool at <address></address>",
  },
  firstSeen: "First seen in the mempool {age} ({date}).",
  waitedConfirming:
    "Waited {duration} before confirming — based on a first-seen sample, not a consensus fact.",
  waitedRemoved:
    "Waited {duration} before being removed — based on a first-seen sample, not a consensus fact.",
  coins: "Coins",
  coinSpends: {
    title: "Coin spends ({count})",
    inferredHint:
      "Coinset never saw this bundle in the mempool; the spends are rebuilt from the block it landed in, so fee and cost are what the block records.",
    lineMempool:
      "{spent} spent → {created} created · {cost} cost · spends <amount></amount> · as seen in the mempool",
    lineInferred:
      "{spent} spent → {created} created · {cost} cost · spends <amount></amount> · rebuilt from the block",
    coins: {
      one: "{count} coin",
      other: "{count} coins",
    },
  },
  flow: {
    inputs: "Inputs · removals",
    outputs: "Outputs · additions",
    none: "None",
    more: "…and {count} more (see raw JSON).",
    coin: "coin <hash></hash>",
    srSummary:
      "{inputs} inputs totalling {totalIn} flow into {outputs} outputs totalling {totalOut}; fee {fee}. Input {first}.",
  },
  verdict: {
    noCostLabel: "No cost recorded",
    noCostDetail:
      "This summary was inferred from the chain, so cost and fee rate are not available.",
    share: "{percent} of a block",
    noFeeLabel: "No fee paid",
    noFeeDetail:
      "Used {share}; the farmer included it for free, or it was small enough to fit anyway.",
    paidDetail: "Used {share} for this fee rate.",
  },
};

export default messages;
