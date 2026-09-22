/** Fee cards on the dashboard and the /fees page (src/widgets/fees). */
const messages = {
  cards: {
    title: "Transaction fees",
    hint: "Chia fees are paid per CLVM cost, not per byte. Estimates are for a reference spend of {cost} cost (a typical single XCH send). Multiply the mojo-per-cost rate by your spend's cost for the fee.",
    targets: {
      nextBlock: "Next block",
      fiveMinutes: "~5 minutes",
      tenMinutes: "~10 minutes",
    },
    mojoPerCost: "mojo/cost",
    notAvailable: "n/a",
    capacityAvailable: "Capacity available.",
    zeroFeeAccepted: "0-fee spends are accepted.",
    aboveToEnter: "Above {rate} mojo/cost to enter.",
    nearCapacity: "Near capacity.",
    fullMempool:
      "A full mempool takes at least 5 mojo/cost and only above the cheapest spends it can evict.",
    paidAhead: "Paid spends go ahead of the 0-fee backlog.",
    lastBlock:
      "Last transaction block paid {fees} in fees at {rate} mojo/cost · current rate {current} mojo/cost.",
  },
  page: {
    title: "Fees",
    intro:
      "What the node estimates for a {cost}-cost transfer, the mempool's current rate distribution, and what common spend shapes cost at the going rate. Read on request from Coinset, nothing stored on our server.",
    nodeEstimate: "Node estimate",
    withinMinutes: { one: "Within {count} min", other: "Within {count} min" },
    rateSub: "{rate} mojo/cost",
    estimateNote:
      "get_fee_estimate at {cost} cost. USD conversion is not shown: no verified public price-history endpoint exists yet (same gap as the Market chart on /charts).",
    rateDistribution: "Rate distribution",
    pendingBundles: { one: "{count} pending bundle", other: "{count} pending bundles" },
    colRate: "Mojo/cost",
    colBundles: "Bundles",
    colCost: "Cost",
    transferTitle: "What a transfer costs",
    atCurrentRate: "at the current rate, {rate} mojo/cost",
    colSpend: "Spend",
    colFee: "Fee",
    feesChart: {
      title: "Fees per transaction block",
      definition: "Average total fees paid in a transaction block.",
      technical:
        "Averaged per sampling window from get_block_records (block_record.fees); bounded number of windows regardless of range.",
    },
    medianChart: {
      title: "Median fee rate",
      definition: "The middle fee rate among transactions in a block, over time.",
      technical:
        "Not sampled at chart scale: needs each block's per-transaction costs (an indexed fetch per block), too heavy to sample across a range without a server-side cache.",
      unavailable:
        "Not sampled at chart scale — needs a per-block indexed fetch. Bundle fee rates in the mempool feed and transaction pages are exact.",
    },
    footer:
      "Rates shown elsewhere — the mempool feed, transaction and block pages — are exact per-item figures, not sampled.",
  },
  transfers: {
    plain: "Plain transfer",
    threeInputs: "Transfer with 3 inputs",
    cat: "Send a CAT",
    nft: "Transfer an NFT",
    offer: "Accept an offer",
  },
};

export default messages;
