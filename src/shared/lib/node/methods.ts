/**
 * The full-node RPC methods mempoolxch.space calls, split by who serves them. Shared by the dev
 * proxy (which forwards only STANDARD) and the probe (which calls each one).
 */

/** Standard Chia full-node RPC: any node answers these. */
export const STANDARD_METHODS = [
  "get_blockchain_state",
  "get_network_space",
  "get_fee_estimate",
  "get_block_record_by_height",
  "get_block_record",
  "get_block_records",
  "get_block",
  "get_additions_and_removals",
  "get_block_spends",
  "get_coin_record_by_name",
  "get_coin_records_by_names",
  "get_coin_records_by_parent_ids",
  "get_coin_records_by_puzzle_hash",
  "get_coin_records_by_hint",
  "get_puzzle_and_solution",
  "get_all_mempool_tx_ids",
  "get_all_mempool_items",
  "get_mempool_item_by_tx_id",
  "get_mempool_items_by_coin_name",
  "get_connections",
  "push_tx",
] as const;

/** Coinset's indexed API only: a plain node does not know them, and the app hides what uses them. */
export const COINSET_ONLY_METHODS = [
  "get_transaction",
  "get_raw_transaction_by_id",
  "get_transactions_by_coin_name",
  "get_transactions_by_cat_asset_id",
  "get_transactions_by_nft_id",
  "get_latest_nft_coin_by_nft_id",
  "get_singleton_info",
  "get_offer",
  "get_offers_by_nft_id",
  "get_offers_by_cat_asset_id",
  "get_memos_by_coin_name",
  "get_clawback_coins_by_receiver",
  "get_coin_details",
  "get_block_transactions",
  "get_reorgs",
] as const;

export type StandardMethod = (typeof STANDARD_METHODS)[number];
