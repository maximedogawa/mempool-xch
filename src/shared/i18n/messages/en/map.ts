/** Network map page and world map (src/widgets/map), with the labels for src/shared/lib/map. */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Network map",
  titleHint:
    "Every figure on this page comes from Chia's published Peer Info dashboard snapshot. Country markers show aggregate node populations at representative points; no browser crawler or address harvesting is needed.",
  intro:
    "Where the Chia full-node population sits, what it runs and what the network is doing right now. Search or pick a region to narrow the map, then click a country for its detail.",
  stats: {
    fullNodes: "Full nodes",
    fullNodesSub: "seen in the last 5 days",
    mainnetOnly: "mainnet only",
    fullNodesHint:
      "Full-node population reported by Chia's Peer Info dashboard over a five-day window.",
    reliable: "Reliable",
    reliableSub: "{share} of the network",
    reliableHint:
      "Nodes stable enough that the crawler hands them out through the DNS introducers.",
    ipv6: "IPv6",
    ipv6Sub: { one: "{count} node", other: "{count} nodes" },
    ipv6Hint: "Share of the population the crawler reached over IPv6. A node can answer on both.",
    countries: "Countries",
    countriesSub: { one: "{count} node placed", other: "{count} nodes placed" },
    countriesHint:
      "Countries the crawler reported, all of them with a representative point on the map.",
    concentration: "Concentration",
    concentrationValue: { one: "{count} country", other: "{count} countries" },
    concentrationSub: "{country} holds {share}",
    concentrationHint: "How many of the largest countries it takes to hold half of all full nodes.",
    snapshot: "Snapshot",
    snapshotSub: "last observed",
    unavailable: "unavailable",
    snapshotHint: "Age of the dashboard capture this page is drawn from.",
  },
  mapCard: {
    title: "Chia full nodes — live",
    modelledReach: "Modelled reach",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    resetView: "Reset map view",
    reset: "reset",
    searchLabel: "Filter the map by country or region",
    searchPlaceholder: "filter the map — country, code or region",
    suggestionNodes: { one: "{count} node", other: "{count} nodes" },
    filteredSummary: "{shown} of {total} countries · {nodes} nodes ({share})",
    summary: "{nodes} full nodes · {countries} countries",
    controls: "drag to pan · double-click or ⌘/ctrl + wheel to zoom · {scale}×",
    noMatch: "No country matches “{query}”.",
  },
  worldMap: {
    label: "World map of {nodes} observed Chia nodes in {countries} countries",
    marker: {
      one: "{country}: {count} node, rank {rank}",
      other: "{country}: {count} nodes, rank {rank}",
    },
    peer: "Connected peer {host} near {place}",
  },
  activity: {
    title: "Live activity as seen by this node",
    counts: "{blocks} blocks · {bundles} bundles",
    waiting: "Waiting for the first event…",
    newPeak: "New peak <link>#{height}</link>",
  },
  versions: {
    title: "Node versions",
    reporting: {
      one: "{count} node reports a version",
      other: "{count} nodes report a version",
    },
    empty: "The snapshot carries no version panel.",
    note: "Shares are of the {reporting} nodes whose version the crawler knows ({coverage} of the population).",
    noteNewest:
      "Shares are of the {reporting} nodes whose version the crawler knows ({coverage} of the population); {newest} is the newest build reported.",
  },
  regions: {
    title: "Regions",
    action: "click to filter the map",
    names: {
      europe: "Europe",
      asia: "Asia",
      northAmerica: "North America",
      southAmerica: "South America",
      africa: "Africa",
      oceania: "Oceania",
      unmapped: "Unmapped",
    },
  },
  reach: {
    title: "Reachability",
    action: "five-day crawler window",
    ipv4: "IPv4",
    ipv6: "IPv6",
    reliable: "Reliable",
    ipv4Hint: "Nodes the crawler reached over IPv4 in the last five days.",
    ipv6Hint: "Nodes the crawler reached over IPv6 in the last five days.",
    reliableHint: "Nodes stable enough for the crawler to hand out through the DNS introducers.",
    overlap:
      "IPv4 and IPv6 shares overlap: a dual-stack node is counted in both, so they add up to more than the population.",
  },
  countries: {
    title: "Countries",
    titleFiltered: "Countries — filtered",
    action: "{nodes} nodes in {countries} countries",
    noSnapshot: "No dashboard snapshot for this network.",
    noMatch: "No country matches the current filter.",
    tableLabel: "Countries",
    country: "Country",
    region: "Region",
    nodes: "Nodes",
    share: "Share",
    showTop: "Show the top {count} only",
    showAll: "Show all {count} countries",
  },
  about: {
    title: "What this map is",
    shows:
      "<b>What it shows.</b> Country-level full-node populations from Chia's Peer Info dashboard, captured {age}, plus the connected peers of a configured node. Marker size is the node count; colour is the region.",
    showsMainnet:
      "<b>What it shows.</b> Country-level full-node populations from Chia's Peer Info dashboard, captured for mainnet, plus the connected peers of a configured node. Marker size is the node count; colour is the region.",
    notShows:
      "<b>What it is not.</b> Chia does not publish node coordinates, nor where a block was farmed or a spend bundle came from. Markers sit at one representative point per country, and the reach arcs and pulses are a model of propagation, not a packet route.",
  },
  source:
    "Source: <link>Chia Peer Info dashboard</link>, observed {observed} UTC. The country panel accounts for {placed} of the {total} nodes the population panel reports. Only node addresses are ever sent to a geolocation service, never the visitor's.",
  sourceGap:
    "Source: <link>Chia Peer Info dashboard</link>, observed {observed} UTC. The country panel accounts for {placed} of the {total} nodes the population panel reports; the {gap}-node gap is between two separate dashboard queries, not a rounding error. Only node addresses are ever sent to a geolocation service, never the visitor's.",
  ownNodeHint: "Point Settings at your own node to also see its connected peers here.",
  detail: {
    nodes: "Nodes",
    share: "Share",
    rank: "Rank",
    region: "Region",
    yourPeers: "Your peers",
    note: "Dashboard estimate at a representative point, not a located node.",
  },
  peers: {
    errorTitle: "Could not read connections",
    errorDescription: "Your node did not answer get_connections.",
    none: "No peer connections reported.",
    title: "Your node's connections",
    action: {
      one: "{count} peer · refreshes every 15 s",
      other: "{count} peers · refreshes every 15 s",
    },
    tableLabel: "Connections",
    peer: "Peer",
    type: "Type",
    location: "Location",
    network: "Network",
    peakHeight: "Peak height",
    sentReceived: "Sent / received",
    connected: "Connected",
    unknownType: "Type {type}",
    types: {
      fullNode: "Full node",
      harvester: "Harvester",
      farmer: "Farmer",
      timelord: "Timelord",
      introducer: "Introducer",
      wallet: "Wallet",
    },
  },
};

export default defineNamespace("map", messages);
