/** API reference page (src/widgets/api) and the endpoint descriptions of src/shared/config/apiReference.ts. */
const messages = {
  title: "API reference",
  titleHint:
    "mempoolxch.space has no server API of its own: every page you see reads a chain endpoint directly from your browser, the same way this app does. This page documents the calls the app itself makes, so you can make them too, against Coinset's public endpoint or your own node.",
  coinsetOnly: "Coinset only",
  anyFullNode: "any full node",
  showExample: "Show example",
  hideExample: "Hide example",
  base: {
    title: "Base URLs",
    intro:
      "Every method below is a <code>POST</code> to <code>{base}/{method}</code> with a JSON body, no authentication, CORS open. The full-node RPC and Coinset's indexed API share the same host.",
    mainnet: "Mainnet:",
    testnet: "Testnet11:",
    websocket: "WebSocket (peak and transaction events):",
    specs:
      'Full OpenAPI specs: <code>coinset.org/openapi/full_node_bundled.json</code> and <code>coinset.org/openapi/coinset_bundled.json</code>. Endpoints marked "any full node" work against your own node too — see <link>Settings → custom node</link>.',
  },
  groups: {
    chain: "Chain and mempool",
    blocks: "Blocks",
    transactions: "Transactions (indexed, Coinset only)",
    coins: "Coins",
    balances: "Balances and assets (indexed, Coinset only)",
    offers: "Offers, clawbacks and reorgs (indexed, Coinset only)",
  },
  endpoints: {
    get_blockchain_state:
      "Peak height and hash, mempool size and cost, block max cost, difficulty, sync state.",
    get_fee_estimate: "Fee-per-cost estimate for one or more target confirmation times.",
    get_all_mempool_tx_ids: "Every spend-bundle id currently in the mempool.",
    get_all_mempool_items:
      "Every pending spend bundle in full. Large (tens of MB); the app diffs it against ids it already has instead of refetching whole.",
    get_mempool_item_by_tx_id: "One pending spend bundle by id.",
    get_mempool_items_by_coin_name: "Pending spend bundles touching a coin.",
    get_network_space: "Estimated netspace between two header hashes.",
    get_block_records:
      "Block records in a height range, end exclusive. Coinset caps a single call at 1,000 records.",
    get_block_record_by_height: "One block record by height.",
    get_block_record: "One block record by header hash.",
    get_block: "The full block (generator info, reward claims) by header hash.",
    get_block_spends: "Coin spends in a block (custom-node fallback for coin flow).",
    get_additions_and_removals: "Coins created and removed in a block, for the coin-flow view.",
    get_block_transactions: "Semantic transaction summaries confirmed in a block, paginated.",
    get_transaction: "One semantic transaction summary by spend-bundle id.",
    get_transactions_by_p2:
      "Transaction history for an address's puzzle hash, paginated, newest first.",
    get_pending_transactions_by_p2: "Pending transactions for an address.",
    get_transactions_by_cat_asset_id: "Transaction history for a CAT asset id, paginated.",
    get_transactions_by_nft_id: "Transaction history for an NFT.",
    get_transactions_by_coin_name: "The transaction that created and, if spent, removed a coin.",
    get_coin_record_by_name: "One coin record by coin id.",
    get_coin_records_by_names: "Coin records by a list of coin ids.",
    get_coin_records_by_puzzle_hash: "Coin records paid to a puzzle hash.",
    get_coin_records_by_hint: "Coin records by memo hint (how wallets find their own coins).",
    get_coin_records_by_parent_ids: "Coin records created by a list of parent coin ids.",
    get_puzzle_and_solution: "The reveal and solution a coin was spent with.",
    get_memos_by_coin_name: "Memo strings attached to a coin's spend.",
    get_coin_details: "Coin semantics (kind, asset id) when Coinset can classify it.",
    push_tx: "Submit a spend bundle to the mempool.",
    get_xch_balance_by_p2: "Confirmed and pending XCH balance for a puzzle hash.",
    get_cat_balances_by_p2: "CAT balances for a puzzle hash.",
    get_nft_balance_by_p2: "NFT count for a puzzle hash.",
    get_singleton_info: "Singleton (NFT/DID) lineage by launcher id.",
    get_latest_nft_coin_by_nft_id: "The current unspent coin of an NFT.",
    get_offer:
      "Lifecycle state of one offer by id: both sides, makers, the taking or cancelling transaction.",
    get_offers_by_p2: "Offers made from a puzzle hash, one lifecycle status per call.",
    get_offers_by_cat_asset_id: "Offers that offer or request a CAT.",
    get_offers_by_nft_id: "Offers that offer or request an NFT.",
    get_clawback_coins_by_receiver:
      "Clawback coins sent to a puzzle hash, with timelock and whether the sender can still revoke.",
    get_reorgs: "Chain reorganisations Coinset detected, newest first.",
    get_raw_transaction_by_id:
      "Mempool-style item (coin spends, additions, removals) of a bundle even after it left the mempool.",
  },
  otherData: {
    title: "Other data",
    dexie:
      "CAT names, tickers and icons come from Dexie's public registry: <code>GET https://api.dexie.space/v1/assets?type=cat</code> (paginated, 100 per page), icons at <code>https://icons.dexie.space/{asset_id}.webp</code>.",
    mintgarden:
      "NFT metadata and images come from MintGarden: <code>GET https://api.mintgarden.io/nfts/{nft1_id}</code>.",
  },
  embeds: {
    title: "Embeds and badges",
    theme: "Embed theme",
    dark: "dark",
    light: "light",
    intro:
      "Drop-in widgets for pools, wallets and community sites. Each is a small static page (under 15 KB of script, no framework) that fetches Coinset directly from the visitor's browser, so nothing about your visitors reaches us. <code>?theme=dark|light</code> picks the colours, <code>&network=testnet11</code> switches network. They may be framed from any origin.",
    preview: "preview",
    items: {
      blocks: {
        title: "Block queue",
        what: "The projected next blocks and the last three transaction blocks.",
      },
      fees: {
        title: "Fee cards",
        what: "The node's fee estimate for next block, ~5 and ~10 minutes.",
      },
      mempool: {
        title: "Mempool occupancy",
        what: "Bundles waiting, cost used of the node's capacity, total fees.",
      },
      tx: {
        title: "Transaction status",
        what: "Pending, confirmed or removed for one transaction id.",
      },
    },
    badgeTitle: "SVG badge",
    badgeWhat:
      "A shields-style image for READMEs and pages that cannot run scripts; served by mempoolxch.space, cached for a minute.",
  },
  fairUse: {
    title: "Rate limits and fair use",
    limits:
      "These are Coinset's, Dexie's and MintGarden's endpoints, not ours: we cannot set their rate limits, and none are published as of this writing. Be considerate — cache what you fetch, batch where an endpoint allows it (for example <code>get_block_records</code>' height range, capped at 1,000 per call), and avoid polling faster than roughly once per block (~18–20 s on mainnet).",
    terms:
      "mempoolxch.space's own <link>Terms of use</link> still govern this site itself (uptime, acceptable use of the pages you load here); using Coinset, Dexie or MintGarden directly is between you and them.",
  },
};

export default messages;
