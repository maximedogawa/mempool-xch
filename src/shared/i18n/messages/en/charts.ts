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
    sampledOnly: "Only the last 2 hours are sampled in this browser; pick 6h or 24h to see it.",
    sameSample: "Same 2-hour browser sample as Cost used.",
    perWindow: "Counted per sampling window from get_block_records.",
    noNetspace:
      "Not available on this endpoint: get_network_space did not answer for this endpoint.",
  },
  price: {
    title: "XCH price (USDT)",
    definition: "The XCH/USDT spot price over time: the closing price of each candle.",
    technical:
      "Gate.io's public spot candlesticks for XCH_USDT, one request per range (5-minute candles for 6h up to weekly candles for All). USDT tracks the US dollar closely but is not the same thing.",
    unavailable:
      "Gate.io's price history did not answer. It is fetched directly from this browser; try again later.",
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
    definition:
      "The fee rate in the middle of the pending cost: half the cost waiting in the mempool pays more, half pays less.",
    technical:
      "Sampled in this browser with the other mempool series: bundles are ordered by fee rate (mojos per cost) and the rate at half the total pending cost is kept. Weighted by cost, so a few large free spends pull it towards 0.",
  },
  feesPerTxBlock: {
    title: "Fees per transaction block",
    definition: "Average total fees paid in a transaction block.",
    technical:
      "Averaged per sampling window from get_block_records (block_record.fees); bounded number of windows regardless of range.",
  },
  costPerTxBlock: {
    title: "Cost per transaction block",
    definition: "CLVM cost used by a transaction block, out of the 11 billion a block allows.",
    technical:
      "For the newest transaction block of each sampling window: transactions_info.cost from get_block. One block per window (6 to 24 per range), each fetched once per session.",
  },
  txBlocksPerHour: {
    title: "Transaction blocks per hour",
    definition: "How many blocks in the window carried transactions.",
  },
  spendsPerTxBlock: {
    title: "Spends per transaction block",
    definition: "Coins spent in a transaction block.",
    technical:
      "For the same sampled blocks as Cost per transaction block: the number of removals from get_additions_and_removals. Reward claims are created, not spent, so they are not counted.",
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
    definition: "The proof-of-space difficulty blocks were farmed at.",
    technical:
      "From the block records the other series already fetch: a block's weight is the chain's cumulative difficulty, so the weight step from one height to the next is that block's difficulty. Median per sampling window. It changes once per epoch (4,608 blocks).",
  },
  blocksPerHour: {
    title: "Blocks per hour",
    definition: "All blocks (transaction and non-transaction) per hour.",
  },
};

export default messages;
