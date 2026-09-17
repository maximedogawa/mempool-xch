/**
 * Reference for the /api page: mempoolxch.space has no server API of its own — every
 * page reads Coinset (or, for CAT names/icons and NFT metadata, Dexie/MintGarden) directly from
 * the browser. This is a hand-maintained mirror of the calls src/shared/lib/rpc
 * actually makes, kept in sync with it and with the wiki's architecture/data-sources.md.
 */

export interface ApiEndpoint {
  method: string;
  api: "rpc" | "indexed";
  summary: string;
  body: string;
}

export interface ApiGroup {
  title: string;
  endpoints: ApiEndpoint[];
}

const rpc = (method: string, summary: string, body = "{}"): ApiEndpoint => ({ method, api: "rpc", summary, body });
const indexed = (method: string, summary: string, body: string): ApiEndpoint => ({ method, api: "indexed", summary, body });

export const API_GROUPS: readonly ApiGroup[] = [
  {
    title: "Chain and mempool",
    endpoints: [
      rpc("get_blockchain_state", "Peak height and hash, mempool size and cost, block max cost, difficulty, sync state."),
      rpc("get_fee_estimate", "Fee-per-cost estimate for one or more target confirmation times.", '{ "cost": 6000000, "target_times": [60, 300, 600] }'),
      rpc("get_all_mempool_tx_ids", "Every spend-bundle id currently in the mempool."),
      rpc("get_all_mempool_items", "Every pending spend bundle in full. Large (tens of MB); the app diffs it against ids it already has instead of refetching whole."),
      rpc("get_mempool_item_by_tx_id", "One pending spend bundle by id.", '{ "tx_id": "0x…" }'),
      rpc("get_mempool_items_by_coin_name", "Pending spend bundles touching a coin.", '{ "coin_name": "0x…" }'),
      rpc("get_network_space", "Estimated netspace between two header hashes.", '{ "older_block_header_hash": "0x…", "newer_block_header_hash": "0x…" }'),
    ],
  },
  {
    title: "Blocks",
    endpoints: [
      rpc("get_block_records", "Block records in a height range, end exclusive. Coinset caps a single call at 1,000 records.", '{ "start": 9300000, "end": 9300100 }'),
      rpc("get_block_record_by_height", "One block record by height.", '{ "height": 9300000 }'),
      rpc("get_block_record", "One block record by header hash.", '{ "header_hash": "0x…" }'),
      rpc("get_block", "The full block (generator info, reward claims) by header hash.", '{ "header_hash": "0x…" }'),
      rpc("get_block_spends", "Coin spends in a block (custom-node fallback for coin flow).", '{ "header_hash": "0x…" }'),
      rpc("get_additions_and_removals", "Coins created and removed in a block, for the coin-flow view.", '{ "header_hash": "0x…" }'),
      indexed("get_block_transactions", "Semantic transaction summaries confirmed in a block, paginated.", '{ "height": 9300000, "limit": 50 }'),
    ],
  },
  {
    title: "Transactions (indexed, Coinset only)",
    endpoints: [
      indexed("get_transaction", "One semantic transaction summary by spend-bundle id.", '{ "tx_id": "0x…" }'),
      indexed("get_transactions_by_p2", "Transaction history for an address's puzzle hash, paginated, newest first.", '{ "p2": "0x…", "order": "desc", "limit": 50 }'),
      indexed("get_pending_transactions_by_p2", "Pending transactions for an address.", '{ "p2": "0x…" }'),
      indexed("get_transactions_by_cat_asset_id", "Transaction history for a CAT asset id, paginated.", '{ "asset_id": "0x…", "order": "desc", "limit": 10 }'),
      indexed("get_transactions_by_nft_id", "Transaction history for an NFT.", '{ "nft_id": "nft1…" }'),
      indexed("get_transactions_by_coin_name", "The transaction that created and, if spent, removed a coin.", '{ "coin_name": "0x…" }'),
    ],
  },
  {
    title: "Coins",
    endpoints: [
      rpc("get_coin_record_by_name", "One coin record by coin id.", '{ "name": "0x…" }'),
      rpc("get_coin_records_by_names", "Coin records by a list of coin ids.", '{ "names": ["0x…"], "include_spent_coins": true }'),
      rpc("get_coin_records_by_puzzle_hash", "Coin records paid to a puzzle hash.", '{ "puzzle_hash": "0x…", "include_spent_coins": false }'),
      rpc("get_coin_records_by_hint", "Coin records by memo hint (how wallets find their own coins).", '{ "hint": "0x…", "include_spent_coins": false }'),
      rpc("get_coin_records_by_parent_ids", "Coin records created by a list of parent coin ids.", '{ "parent_ids": ["0x…"], "include_spent_coins": true }'),
      rpc("get_puzzle_and_solution", "The reveal and solution a coin was spent with.", '{ "coin_id": "0x…", "height": 9300000 }'),
      rpc("get_memos_by_coin_name", "Memo strings attached to a coin's spend.", '{ "coin_name": "0x…" }'),
      indexed("get_coin_details", "Coin semantics (kind, asset id) when Coinset can classify it.", '{ "coin_id": "0x…" }'),
      rpc("push_tx", "Submit a spend bundle to the mempool.", '{ "spend_bundle": { … } }'),
    ],
  },
  {
    title: "Balances and assets (indexed, Coinset only)",
    endpoints: [
      indexed("get_xch_balance_by_p2", "Confirmed and pending XCH balance for a puzzle hash.", '{ "p2": "0x…" }'),
      indexed("get_cat_balances_by_p2", "CAT balances for a puzzle hash.", '{ "p2": "0x…", "limit": 200 }'),
      indexed("get_nft_balance_by_p2", "NFT count for a puzzle hash.", '{ "p2": "0x…" }'),
      indexed("get_singleton_info", "Singleton (NFT/DID) lineage by launcher id.", '{ "launcher_id": "0x…" }'),
      indexed("get_latest_nft_coin_by_nft_id", "The current unspent coin of an NFT.", '{ "nft_id": "nft1…" }'),
    ],
  },
];

export const RPC_BASE = "https://api.coinset.org";
export const RPC_BASE_TESTNET = "https://testnet11.api.coinset.org";
export const WS_URL = "wss://api.coinset.org/ws?events=peak,transaction";
