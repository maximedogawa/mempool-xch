/** Charts page, chart cards and chart controls (src/widgets/charts). */
const messages = {
  title: "Charts",
  tooltipCoinset:
    "Series built on request from Coinset — nothing is stored on our server. Series no provider can answer yet are not listed.",
  tooltipCustom:
    "Series built on request from your configured endpoint — nothing is stored on our server. Series no provider can answer yet are not listed.",
  sections: {
    market: "Market",
    mempool: "Mempool",
    blocks: "Blocks",
    network: "Network",
    coinSet: "Coin set",
  },
  card: {
    latest: "Latest",
    average: "Average",
    highest: "Highest",
    points: "Points",
    notEnoughData: "Not enough data yet.",
    definition: "Definition & technical note",
  },
  controls: {
    range: "Range",
    smoothing: "Smoothing",
    scale: "Scale",
    linear: "Linear",
    log: "Log",
  },
  notes: {
    noCoinset:
      "Coinset's indexed API has no aggregate endpoint for this (verified against its OpenAPI spec); a future provider such as nodexch could add it.",
    needsCoinsetAggregate: "Would need a Coinset aggregate endpoint.",
    sampledOnly: "Only the last 2 hours are sampled in this browser; pick 6h or 24h to see it.",
    sameSample: "Same 2-hour browser sample as Cost used.",
    perWindow: "Counted per sampling window from get_block_records.",
    noNetspace:
      "Not available on this endpoint: get_network_space did not answer for this endpoint.",
  },
  price: {
    title: "XCH price (USD)",
    definition: "The XCH/USD spot price over time.",
    technical: "Would come from Dexie's price data.",
    unavailable:
      "No verified public price-history endpoint yet. The Sage wallet shows a live spot price in the header when connected; this chart needs history, which Dexie does not publish a documented endpoint for today.",
  },
  costUsed: {
    title: "Cost used",
    definition: "Total CLVM cost of every pending spend bundle.",
    technical:
      "Sampled in this browser every time the mempool summary refreshes; kept for 2 hours.",
    unavailable:
      "Only the last 2 hours are sampled in this browser (Coinset has no mempool history endpoint); pick 6h or 24h to see it.",
  },
  waitingBundles: {
    title: "Waiting bundles",
    definition: "Spend bundles sitting in the mempool.",
  },
  totalFees: {
    title: "Total fees",
    definition: "Fees offered by every pending spend bundle, summed.",
  },
  medianFeeRate: {
    title: "Median fee rate",
    definition: "The middle fee rate among pending spend bundles.",
    technical:
      "Not tracked by the browser sampler yet (it keeps totals per fee band, not the full distribution).",
    unavailable:
      "Not sampled yet: the mempool history keeps totals per fee band, not enough to recover a median.",
  },
  feesPerTxBlock: {
    title: "Fees per transaction block",
    definition: "Average total fees paid in a transaction block.",
    technical:
      "Averaged per sampling window from get_block_records (block_record.fees); bounded number of windows regardless of range.",
  },
  costPerTxBlock: {
    title: "Cost per transaction block",
    definition: "Average CLVM cost used in a transaction block.",
    technical:
      "Not sampled at chart scale: exact cost needs a full get_block fetch per block, too heavy to sample across a range without a server-side cache. See a block's own page for its exact cost.",
    unavailable:
      "Not sampled at chart scale — needs one full-block fetch per block. See a block's own page for its exact cost.",
  },
  txBlocksPerHour: {
    title: "Transaction blocks per hour",
    definition: "How many blocks in the window carried transactions.",
  },
  spendsPerTxBlock: {
    title: "Spends per transaction block",
    definition: "Average number of coins spent in a transaction block.",
    technical:
      "Not sampled at chart scale: needs a per-block indexed or additions/removals fetch, too heavy to sample across a range without a server-side cache. See a block's own page for its spends.",
    unavailable:
      "Not sampled at chart scale — needs a per-block fetch. See a block's own page for its spends.",
  },
  shareOfTxBlocks: {
    title: "Share of transaction blocks",
    definition: "Transaction blocks as a share of all blocks (roughly a third).",
  },
  timeBetweenTxBlocks: {
    title: "Time between transaction blocks",
    definition: "Average gap between consecutive transaction blocks.",
    technical: "Averaged per sampling window from get_block_records timestamps.",
  },
  netspace: {
    title: "Netspace",
    definition: "Estimated total space farming the network.",
    technical:
      "get_network_space between each sampling window's first and last block — the node's own difficulty-based estimate, not derived by us.",
  },
  difficulty: {
    title: "Difficulty",
    definition: "The node's current proof-of-space difficulty target.",
    technical:
      "No verified way to recover historical difficulty from get_block_records; get_blockchain_state only reports the current value.",
    unavailable:
      "Not derivable from available endpoints without unverified math — a wrong number here would be worse than none. get_blockchain_state shows the current value on Settings.",
  },
  blocksPerHour: {
    title: "Blocks per hour",
    definition: "All blocks (transaction and non-transaction) per hour.",
  },
  unspentCoins: {
    title: "Unspent coins",
    definition: "Total coins not yet spent.",
  },
  activePuzzleHashes: {
    title: "Active puzzle hashes",
    definition: "Distinct puzzle hashes holding coins.",
  },
  coinAge: {
    title: "Coin age",
    definition: "Average age of unspent coins.",
  },
};

export default messages;
