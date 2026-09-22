/** Display text produced by shared lib helpers (src/shared/lib, src/shared/api). */
const messages = {
  channel: {
    customName: "Polling (custom node)",
    customDetail:
      "Polling your node at {host} every few seconds; no stream, mempool fetched in the browser.",
    offlineName: "Offline",
    offlineDetail: "No connection to {host}.",
    socketName: "Coinset socket",
    socketDetail: "Streaming peak and transaction events from {host} directly.",
    reconnectingName: "Coinset socket (reconnecting)",
    reconnectingDetail: "Reconnecting to {host}.",
    pollingName: "Polling",
    pollingDetail: "Polling {host} every few seconds.",
  },
  rpcError: {
    network: "Could not reach the node. Check your connection or the configured endpoint.",
    http: "The node answered with HTTP {status}.",
    httpUnknown: "The node answered with HTTP error.",
    malformed: "The node returned a response that could not be parsed.",
    notFound: "Not found.",
    aborted: "Request cancelled.",
  },
  assets: {
    nfts: { one: "{count} NFT", other: "{count} NFTs" },
    dids: { one: "{count} DID", other: "{count} DIDs" },
    singletons: { one: "{count} singleton", other: "{count} singletons" },
    poolClaims: { one: "{count} pool claim", other: "{count} pool claims" },
  },
  sensitivity: {
    title: "Sensitive content",
    summary: "{title}. Reason: {reason}",
  },
  pending: {
    broadcast: "Sent to the network, not seen in the mempool yet",
    waiting: "In the mempool, behind the projected blocks",
    nextBlock: "Next block · position {position} of {size}",
    projectedBlock: "Projected block {block} · position {position} of {size}",
    confirmed: "Confirmed",
    gone: "No longer pending in the wallet",
  },
  expiry: {
    lessThanDay: "less than a day",
    days: { one: "{count} day", other: "{count} days" },
    months: { one: "{count} month", other: "{count} months" },
    years: { one: "{count} year", other: "{count} years" },
    ago: "{span} ago",
    in: "in {span}",
  },
  range: {
    all: "All",
  },
  smoothing: {
    raw: "Raw",
    smooth: "Smooth",
    verySmooth: "Very smooth",
  },
  vaults: {
    coldUs: "Cold wallet (US)",
    coldCh: "Cold wallet (Switzerland)",
    warmUs: "Warm wallet (US)",
    warmCh: "Warm wallet (Switzerland)",
    custodyCold: "90-day clawback, 30-day withdrawal timelock",
    custodyWarm: "24-hour clawback, 1-hour withdrawal timelock",
  },
};

export default messages;
