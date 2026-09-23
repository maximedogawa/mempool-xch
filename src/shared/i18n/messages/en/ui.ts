/** Shared UI primitives and charts (src/shared/ui). */
const messages = {
  copy: "Copy",
  copyToClipboard: "{label} to clipboard",
  yours: "yours",
  capacity: {
    label: "Mempool capacity",
    costOf: "{used} of {max} cost",
    blocks: "{percent} · {filled}/{segments} blocks",
    valueText: "{used} of {max} cost, {percent}",
  },
  kind: {
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    did: "DID",
    offer: "Offer",
    pool: "Pool",
    singleton: "Singleton",
    unknown: "Unknown",
  },
  summaryKind: {
    transfer: "Transfer",
    swap: "Swap",
    mint: "Mint",
    melt: "Melt",
    combine: "Combine",
    split: "Split",
    pool: "Pool",
    revoke: "Revoke",
    clawback: "Clawback",
    unknown: "Unknown",
  },
  status: {
    pending: "Pending",
    confirmed: "Confirmed",
    removed: "Dropped",
    unknown: "Unknown",
  },
  image: {
    noImage: "{alt} (no image)",
    reason: "Reason: ",
    video: "Video",
    showAnyway: "Show anyway",
    clickToShow: "{summary} — click to show",
    veiled: "{alt}: {summary}",
    veiledButton: "{alt}: {summary}. Show anyway.",
  },
  cat: {
    unknown: "Unknown CAT · 0x{id}",
  },
  chart: {
    notEnough: "Not enough data yet.",
    collecting: "Collecting samples… history starts when the app is opened.",
    lineSummary: {
      one: "{label}. {count} point from {from} to {to}. Latest {latest}.",
      other: "{label}. {count} points from {from} to {to}. Latest {latest}.",
    },
    stackedSummary: {
      one: "{label}. {count} sample from {from} to {to}. Latest total {latest}.",
      other: "{label}. {count} samples from {from} to {to}. Latest total {latest}.",
    },
    total: "Total {value}",
  },
};

export default messages;
