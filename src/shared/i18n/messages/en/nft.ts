/** The NFT section: home, collections, activity, mints, owned gallery and offers (src/widgets/nft). */
const messages = {
  loading: "Loading…",
  showMore: "Show more",
  untitled: "Untitled",
  noAnswer: "MintGarden did not answer.",
  collectionsError: "Could not load collections",
  activityError: "Could not load activity",
  mintsError: "Could not load mints",
  noRecentMints: "No recent mints.",
  home: {
    intro:
      "Collections, activity and mints from MintGarden (mainnet only) and open offers from Dexie — read on request, nothing stored on our server. Figures below are the top 6 collections by 30-day volume, not a platform-wide total: neither provider publishes one.",
    topVolume: "Top collections, 30d volume",
    topVolumeHint: "Sum of the 6 busiest collections' 30-day trade volume.",
    topTrades: "Trades, top collections",
    recentActivity: "Recent activity",
    eventsShown: "events shown below",
    recentMints: "Recent mints",
    mintsShown: "mints shown below",
    spotlight: "Collections in the spotlight",
    allCollections: "All collections →",
    collectionAlt: "collection",
    floor: "{price} floor",
    noFloor: "no floor",
    noCollections: "No collection data available.",
    allActivity: "All activity →",
    noActivity: "No recent activity.",
    newMints: "New mints",
    allMints: "All mints →",
    searchHint:
      "Have an NFT id or a launcher id? Search it above, or open <mono>{path}</mono> directly.",
  },
  collections: {
    title: "NFT collections",
    intro:
      "Sorted by trade volume in the window, from MintGarden. Floor price is MintGarden's own lowest active listing.",
    card: "Collections",
    search: "Search collections",
    window: "Window",
    intervals: { d1: "24h", d7: "7d", d30: "30d", all: "All time" },
    noMatch: 'No collections match "{query}".',
    colCollection: "Collection",
    colItems: "Items",
    colFloor: "Floor",
    colVolume: "Volume",
    colTrades: "Trades",
  },
  activity: {
    title: "NFT activity",
    intro:
      "Mints, transfers, sales and burns across every collection MintGarden indexes, newest first.",
    card: "Activity",
    kind: "Kind",
    kinds: { all: "All", mint: "Mints", transfer: "Transfers", trade: "Sales", burn: "Burns" },
    noEvents: "No events.",
  },
  mints: {
    title: "New mints",
    intro: "NFTs freshly minted across every collection MintGarden indexes, newest first.",
    card: "Mints",
  },
  event: {
    kinds: { mint: "Mint", transfer: "Transfer", trade: "Sale", burn: "Burn" },
    uncategorised: "Uncategorised",
    block: "block {height}",
  },
  offers: {
    title: "Open offers",
    titleCount: "Open offers ({count})",
    found: "found {age}",
    copyOfferFile: "Copy offer file",
    viewOnDexie: "View on Dexie",
    none: "No open offers on Dexie right now.",
    howToAccept:
      "To accept one, paste the offer file into Sage or another Chia wallet, or take it directly on Dexie — this app cannot submit the trade for you; Sage's app bridge does not yet expose a way to accept an offer.",
  },
  owned: {
    invalidTitle: "Not a valid address",
    invalidDescription: "Open the NFT count on an address or DID page to browse its holdings.",
    backToDid: "Back to DID",
    backToAddress: "Back to address",
    title: "Owned NFTs",
    heldBy: "Held by <owner></owner>",
    mainnetTitle: "NFT gallery is available on mainnet",
    mainnetDescription:
      "MintGarden does not provide testnet holdings. The address overview still shows the node’s NFT count.",
  },
};

export default messages;
