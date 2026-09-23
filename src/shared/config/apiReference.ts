/**
 * Reference for the /api page: mempoolxch.space has no server API of its own — every
 * page reads Coinset (or, for CAT names/icons and NFT metadata, Dexie/MintGarden) directly from
 * the browser. This is a hand-maintained mirror of the calls src/shared/lib/rpc
 * actually makes, kept in sync with it and with the wiki's architecture/data-sources.md.
 * Headings and descriptions live in the "api" message namespace, keyed by group id and method.
 */
import type apiMessages from "@/shared/i18n/messages/en/api";

/** Endpoint methods; each has its description under `endpoints` in the "api" messages. */
export type ApiMethod = keyof (typeof apiMessages)["endpoints"];
/** Group ids; each has its heading under `groups` in the "api" messages. */
export type ApiGroupId = keyof (typeof apiMessages)["groups"];

export interface ApiEndpoint {
  method: ApiMethod;
  api: "rpc" | "indexed";
  body: string;
}

export interface ApiGroup {
  id: ApiGroupId;
  endpoints: ApiEndpoint[];
}

const rpc = (method: ApiMethod, body = "{}"): ApiEndpoint => ({ method, api: "rpc", body });
const indexed = (method: ApiMethod, body: string): ApiEndpoint => ({
  method,
  api: "indexed",
  body,
});

export const API_GROUPS: readonly ApiGroup[] = [
  {
    id: "chain",
    endpoints: [
      rpc("get_blockchain_state"),
      rpc("get_fee_estimate", '{ "cost": 6000000, "target_times": [60, 300, 600] }'),
      rpc("get_all_mempool_tx_ids"),
      rpc("get_all_mempool_items"),
      rpc("get_mempool_item_by_tx_id", '{ "tx_id": "0x…" }'),
      rpc("get_mempool_items_by_coin_name", '{ "coin_name": "0x…" }'),
      rpc(
        "get_network_space",
        '{ "older_block_header_hash": "0x…", "newer_block_header_hash": "0x…" }'
      ),
    ],
  },
  {
    id: "blocks",
    endpoints: [
      rpc("get_block_records", '{ "start": 9300000, "end": 9300100 }'),
      rpc("get_block_record_by_height", '{ "height": 9300000 }'),
      rpc("get_block_record", '{ "header_hash": "0x…" }'),
      rpc("get_block", '{ "header_hash": "0x…" }'),
      rpc("get_block_spends", '{ "header_hash": "0x…" }'),
      rpc("get_additions_and_removals", '{ "header_hash": "0x…" }'),
      indexed("get_block_transactions", '{ "height": 9300000, "limit": 50 }'),
    ],
  },
  {
    id: "transactions",
    endpoints: [
      indexed("get_transaction", '{ "tx_id": "0x…" }'),
      indexed("get_transactions_by_p2", '{ "p2": "0x…", "order": "desc", "limit": 50 }'),
      indexed("get_pending_transactions_by_p2", '{ "p2": "0x…" }'),
      indexed(
        "get_transactions_by_cat_asset_id",
        '{ "asset_id": "0x…", "order": "desc", "limit": 10 }'
      ),
      indexed("get_transactions_by_nft_id", '{ "nft_id": "nft1…" }'),
      indexed("get_transactions_by_coin_name", '{ "coin_name": "0x…" }'),
    ],
  },
  {
    id: "coins",
    endpoints: [
      rpc("get_coin_record_by_name", '{ "name": "0x…" }'),
      rpc("get_coin_records_by_names", '{ "names": ["0x…"], "include_spent_coins": true }'),
      rpc(
        "get_coin_records_by_puzzle_hash",
        '{ "puzzle_hash": "0x…", "include_spent_coins": false }'
      ),
      rpc("get_coin_records_by_hint", '{ "hint": "0x…", "include_spent_coins": false }'),
      rpc(
        "get_coin_records_by_parent_ids",
        '{ "parent_ids": ["0x…"], "include_spent_coins": true }'
      ),
      rpc("get_puzzle_and_solution", '{ "coin_id": "0x…", "height": 9300000 }'),
      rpc("get_memos_by_coin_name", '{ "coin_name": "0x…" }'),
      indexed("get_coin_details", '{ "coin_id": "0x…" }'),
      rpc("push_tx", '{ "spend_bundle": { … } }'),
    ],
  },
  {
    id: "balances",
    endpoints: [
      indexed("get_xch_balance_by_p2", '{ "p2": "0x…" }'),
      indexed("get_cat_balances_by_p2", '{ "p2": "0x…", "limit": 200 }'),
      indexed("get_nft_balance_by_p2", '{ "p2": "0x…" }'),
      indexed("get_singleton_info", '{ "launcher_id": "0x…" }'),
      indexed("get_latest_nft_coin_by_nft_id", '{ "nft_id": "nft1…" }'),
    ],
  },
  {
    id: "offers",
    endpoints: [
      indexed("get_offer", '{ "offer_id": "0x…" }'),
      indexed("get_offers_by_p2", '{ "p2": "0x…", "status": "open", "limit": 25 }'),
      indexed(
        "get_offers_by_cat_asset_id",
        '{ "asset_id": "0x…", "status": "open", "filter": "all" }'
      ),
      indexed("get_offers_by_nft_id", '{ "nft_id": "nft1…", "status": "confirmed" }'),
      indexed("get_clawback_coins_by_receiver", '{ "p2": "0x…" }'),
      indexed("get_reorgs", '{ "limit": 20 }'),
      indexed("get_raw_transaction_by_id", '{ "tx_id": "0x…" }'),
    ],
  },
];

export const RPC_BASE = "https://api.coinset.org";
export const RPC_BASE_TESTNET = "https://testnet11.api.coinset.org";
export const WS_URL = "wss://api.coinset.org/ws?events=peak,transaction,reorg,dashboard,vault";
