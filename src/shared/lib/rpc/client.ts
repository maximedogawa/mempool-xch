/**
 * Typed Chia full-node RPC client plus the Coinset indexed API, one instance per configured
 * endpoint. Every call is a POST with a JSON body; responses are parsed with the
 * precision-safe parser and normalised to the domain models in ./types.
 */
import { withHexPrefix } from "@/shared/lib/chia/hex";
import { RpcError } from "./errors";
import { parseJsonSafe, stringifyJsonSafe } from "./json";
import {
  normaliseBlockRecord,
  normaliseBlockchainState,
  normaliseCatBalances,
  normaliseClawbackList,
  normaliseCoinDetails,
  normaliseCoinRecord,
  normaliseCoinSpend,
  normaliseFeeEstimate,
  normaliseFullBlock,
  normaliseMempoolItem,
  normaliseOfferList,
  normaliseOfferState,
  normalisePeerConnection,
  normaliseRawTransaction,
  normaliseReorgList,
  normaliseSingletonInfo,
  normaliseTxList,
  normaliseTxSummary,
  normaliseXchBalance,
} from "./normalise";
import type {
  BlockRecord,
  BlockchainState,
  CatBalance,
  ClawbackList,
  CoinDetails,
  CoinRecord,
  CoinSpend,
  FeeEstimate,
  FullBlockSummary,
  MempoolItem,
  OfferList,
  OfferState,
  OfferStatus,
  PeerConnection,
  RawTransaction,
  ReorgList,
  SingletonInfo,
  TxList,
  TxSummary,
  XchBalance,
} from "./types";

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface RpcClientOptions {
  /** Full-node RPC base URL, e.g. https://api.coinset.org */
  rpcUrl: string;
  /** Coinset indexed API base URL; null when the endpoint is not Coinset. */
  indexedUrl: string | null;
  fetchImpl?: FetchLike;
  /** Per-request timeout in ms. */
  timeoutMs?: number;
}

type Raw = Record<string, unknown>;

export interface ListOptions {
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
}

async function post(
  fetchImpl: FetchLike,
  baseUrl: string,
  method: string,
  params: Raw,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<Raw> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: stringifyJsonSafe(params),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw new RpcError("aborted", method, "aborted");
    throw new RpcError("network", method, `Network error calling ${method}`, { detail: error });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  const text = await response.text();
  if (!response.ok) {
    throw new RpcError("http", method, `HTTP ${response.status} from ${method}`, {
      status: response.status,
      detail: text.slice(0, 200),
    });
  }
  let parsed: unknown;
  try {
    parsed = parseJsonSafe(text);
  } catch (error) {
    throw new RpcError("malformed", method, `Malformed JSON from ${method}`, { detail: error });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new RpcError("malformed", method, `Unexpected response shape from ${method}`);
  }
  const body = parsed as Raw;
  if (body.success === false) {
    const message = typeof body.error === "string" ? body.error : `${method} failed`;
    const kind = /not found|unknown|no such|does not exist/i.test(message) ? "not_found" : "rpc";
    throw new RpcError(kind, method, message, { detail: body });
  }
  return body;
}

export function createRpcClient(options: RpcClientOptions) {
  const fetchImpl: FetchLike = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  const timeoutMs = options.timeoutMs ?? 20_000;
  const rpc = (method: string, params: Raw = {}, signal?: AbortSignal) =>
    post(fetchImpl, options.rpcUrl, method, params, timeoutMs, signal);
  const indexed = (method: string, params: Raw = {}, signal?: AbortSignal) => {
    if (!options.indexedUrl) {
      throw new RpcError("rpc", method, "Indexed API is only available with Coinset endpoints");
    }
    return post(fetchImpl, options.indexedUrl, method, params, timeoutMs, signal);
  };
  const hasIndexed = options.indexedUrl !== null;

  const notFoundIfMissing = <T>(value: T | null | undefined, method: string, what: string): T => {
    if (value === null || value === undefined) throw new RpcError("not_found", method, `${what} not found`);
    return value;
  };

  return {
    rpcUrl: options.rpcUrl,
    indexedUrl: options.indexedUrl,
    hasIndexed,

    /* ---- full node ---- */

    async getBlockchainState(signal?: AbortSignal): Promise<BlockchainState> {
      const r = await rpc("get_blockchain_state", {}, signal);
      return normaliseBlockchainState(r.blockchain_state);
    },

    async getAllMempoolTxIds(signal?: AbortSignal): Promise<string[]> {
      const r = await rpc("get_all_mempool_tx_ids", {}, signal);
      return (Array.isArray(r.tx_ids) ? r.tx_ids : []).map((id) => String(id).replace(/^0x/, ""));
    },

    async getAllMempoolItems(signal?: AbortSignal): Promise<MempoolItem[]> {
      const r = await rpc("get_all_mempool_items", {}, signal);
      const items = r.mempool_items && typeof r.mempool_items === "object" ? (r.mempool_items as Raw) : {};
      return Object.values(items).map(normaliseMempoolItem);
    },

    async getMempoolItemByTxId(txId: string, signal?: AbortSignal): Promise<MempoolItem> {
      const r = await rpc("get_mempool_item_by_tx_id", { tx_id: withHexPrefix(txId) }, signal);
      return normaliseMempoolItem(notFoundIfMissing(r.mempool_item, "get_mempool_item_by_tx_id", "Mempool item"));
    },

    async getMempoolItemsByCoinName(coinName: string, signal?: AbortSignal): Promise<MempoolItem[]> {
      const r = await rpc("get_mempool_items_by_coin_name", { coin_name: withHexPrefix(coinName) }, signal);
      return (Array.isArray(r.mempool_items) ? r.mempool_items : []).map(normaliseMempoolItem);
    },

    async getFeeEstimate(cost: number, targetTimes: number[], signal?: AbortSignal): Promise<FeeEstimate> {
      const r = await rpc("get_fee_estimate", { cost, target_times: targetTimes }, signal);
      return normaliseFeeEstimate(r);
    },

    async getBlockRecords(start: number, end: number, signal?: AbortSignal): Promise<BlockRecord[]> {
      const r = await rpc("get_block_records", { start, end }, signal);
      return (Array.isArray(r.block_records) ? r.block_records : []).map(normaliseBlockRecord);
    },

    /** Estimated netspace between two blocks, from the node's own difficulty-based calculation. */
    async getNetworkSpace(olderHeaderHash: string, newerHeaderHash: string, signal?: AbortSignal): Promise<bigint> {
      const r = await rpc("get_network_space", { older_block_header_hash: withHexPrefix(olderHeaderHash), newer_block_header_hash: withHexPrefix(newerHeaderHash) }, signal);
      return BigInt(String(r.space ?? 0));
    },

    async getBlockRecordByHeight(height: number, signal?: AbortSignal): Promise<BlockRecord> {
      const r = await rpc("get_block_record_by_height", { height }, signal);
      return normaliseBlockRecord(notFoundIfMissing(r.block_record, "get_block_record_by_height", "Block"));
    },

    async getBlockRecord(headerHash: string, signal?: AbortSignal): Promise<BlockRecord> {
      const r = await rpc("get_block_record", { header_hash: withHexPrefix(headerHash) }, signal);
      return normaliseBlockRecord(notFoundIfMissing(r.block_record, "get_block_record", "Block"));
    },

    async getBlock(headerHash: string, signal?: AbortSignal): Promise<FullBlockSummary> {
      const r = await rpc("get_block", { header_hash: withHexPrefix(headerHash) }, signal);
      const block = notFoundIfMissing(r.block, "get_block", "Block") as Raw;
      return normaliseFullBlock({ ...block, header_hash: withHexPrefix(headerHash) });
    },

    async getBlockSpends(headerHash: string, signal?: AbortSignal): Promise<CoinSpend[]> {
      const r = await rpc("get_block_spends", { header_hash: withHexPrefix(headerHash) }, signal);
      return (Array.isArray(r.block_spends) ? r.block_spends : []).map(normaliseCoinSpend);
    },

    async getAdditionsAndRemovals(
      headerHash: string,
      signal?: AbortSignal
    ): Promise<{ additions: CoinRecord[]; removals: CoinRecord[] }> {
      const r = await rpc("get_additions_and_removals", { header_hash: withHexPrefix(headerHash) }, signal);
      return {
        additions: (Array.isArray(r.additions) ? r.additions : []).map(normaliseCoinRecord),
        removals: (Array.isArray(r.removals) ? r.removals : []).map(normaliseCoinRecord),
      };
    },

    async getCoinRecordByName(name: string, signal?: AbortSignal): Promise<CoinRecord> {
      const r = await rpc("get_coin_record_by_name", { name: withHexPrefix(name) }, signal);
      return normaliseCoinRecord(notFoundIfMissing(r.coin_record, "get_coin_record_by_name", "Coin"));
    },

    async getCoinRecordsByNames(names: string[], includeSpent = true, signal?: AbortSignal): Promise<CoinRecord[]> {
      const r = await rpc(
        "get_coin_records_by_names",
        { names: names.map(withHexPrefix), include_spent_coins: includeSpent },
        signal
      );
      return (Array.isArray(r.coin_records) ? r.coin_records : []).map(normaliseCoinRecord);
    },

    async getCoinRecordsByPuzzleHash(
      puzzleHash: string,
      includeSpent = false,
      signal?: AbortSignal
    ): Promise<CoinRecord[]> {
      const r = await rpc(
        "get_coin_records_by_puzzle_hash",
        { puzzle_hash: withHexPrefix(puzzleHash), include_spent_coins: includeSpent },
        signal
      );
      return (Array.isArray(r.coin_records) ? r.coin_records : []).map(normaliseCoinRecord);
    },

    async getCoinRecordsByHint(hint: string, includeSpent = false, signal?: AbortSignal): Promise<CoinRecord[]> {
      const r = await rpc(
        "get_coin_records_by_hint",
        { hint: withHexPrefix(hint), include_spent_coins: includeSpent },
        signal
      );
      return (Array.isArray(r.coin_records) ? r.coin_records : []).map(normaliseCoinRecord);
    },

    async getCoinRecordsByParentIds(parentIds: string[], includeSpent = true, signal?: AbortSignal): Promise<CoinRecord[]> {
      const r = await rpc(
        "get_coin_records_by_parent_ids",
        { parent_ids: parentIds.map(withHexPrefix), include_spent_coins: includeSpent },
        signal
      );
      return (Array.isArray(r.coin_records) ? r.coin_records : []).map(normaliseCoinRecord);
    },

    async getPuzzleAndSolution(coinId: string, height: number, signal?: AbortSignal): Promise<CoinSpend> {
      const r = await rpc("get_puzzle_and_solution", { coin_id: withHexPrefix(coinId), height }, signal);
      return normaliseCoinSpend(notFoundIfMissing(r.coin_solution, "get_puzzle_and_solution", "Coin spend"));
    },

    async getMemosByCoinName(coinName: string, signal?: AbortSignal): Promise<Record<string, string[]>> {
      const r = await rpc("get_memos_by_coin_name", { coin_name: withHexPrefix(coinName) }, signal);
      const memos = r.memos && typeof r.memos === "object" ? (r.memos as Record<string, unknown>) : {};
      return Object.fromEntries(
        Object.entries(memos).map(([k, v]) => [k, (Array.isArray(v) ? v : []).map((m) => String(m))])
      );
    },

    async pushTx(spendBundle: Raw, signal?: AbortSignal): Promise<string> {
      const r = await rpc("push_tx", { spend_bundle: spendBundle }, signal);
      return String(r.status ?? "UNKNOWN");
    },

    /** Connected peers; Coinset's public gateway disables this, custom nodes answer it. */
    async getConnections(signal?: AbortSignal): Promise<PeerConnection[]> {
      const r = await rpc("get_connections", {}, signal);
      return (Array.isArray(r.connections) ? r.connections : []).map(normalisePeerConnection);
    },

    /* ---- Coinset indexed API (null when not Coinset) ---- */

    async getTransaction(txId: string, signal?: AbortSignal): Promise<TxSummary> {
      const r = await indexed("get_transaction", { tx_id: txId }, signal);
      return normaliseTxSummary(notFoundIfMissing(r.transaction, "get_transaction", "Transaction"));
    },

    async getBlockTransactions(height: number, opts: ListOptions = {}, signal?: AbortSignal): Promise<TxList> {
      const r = await indexed("get_block_transactions", { height, ...opts }, signal);
      return normaliseTxList(r);
    },

    async getTransactionsByP2(p2: string, opts: ListOptions = {}, signal?: AbortSignal): Promise<TxList> {
      const r = await indexed("get_transactions_by_p2", { p2: withHexPrefix(p2), order: "desc", ...opts }, signal);
      return normaliseTxList(r);
    },

    async getPendingTransactionsByP2(p2: string, opts: ListOptions = {}, signal?: AbortSignal): Promise<TxList> {
      const r = await indexed("get_pending_transactions_by_p2", { p2: withHexPrefix(p2), order: "desc", ...opts }, signal);
      return normaliseTxList(r);
    },

    async getTransactionsByCatAssetId(assetId: string, opts: ListOptions = {}, signal?: AbortSignal): Promise<TxList> {
      const r = await indexed("get_transactions_by_cat_asset_id", { asset_id: withHexPrefix(assetId), order: "desc", ...opts }, signal);
      return normaliseTxList(r);
    },

    async getTransactionsByNftId(nftId: string, opts: ListOptions = {}, signal?: AbortSignal): Promise<TxList> {
      const r = await indexed("get_transactions_by_nft_id", { nft_id: nftId, order: "desc", ...opts }, signal);
      return normaliseTxList(r);
    },

    /** The creating and spending tx ids of a coin (get_transactions_by_coin_name). */
    async getTransactionsByCoinName(coinName: string, signal?: AbortSignal): Promise<CoinTxLinks> {
      const r = await indexed("get_transactions_by_coin_name", { coin_name: withHexPrefix(coinName) }, signal);
      const id = (v: unknown) => (typeof v === "string" && v ? v.replace(/^0x/, "").toLowerCase() : null);
      return {
        createdInTxId: id(r.created_in_tx_id),
        spentInTxId: id(r.spent_in_tx_id),
        createdTransaction: r.created_transaction ? normaliseTxSummary(r.created_transaction) : null,
        spentTransaction: r.spent_transaction ? normaliseTxSummary(r.spent_transaction) : null,
      };
    },

    async getXchBalanceByP2(p2: string, signal?: AbortSignal): Promise<XchBalance> {
      const r = await indexed("get_xch_balance_by_p2", { p2: withHexPrefix(p2) }, signal);
      return normaliseXchBalance(r);
    },

    async getCatBalancesByP2(p2: string, signal?: AbortSignal): Promise<CatBalance[]> {
      const r = await indexed("get_cat_balances_by_p2", { p2: withHexPrefix(p2), limit: 200 }, signal);
      return normaliseCatBalances(r);
    },

    async getNftBalanceByP2(p2: string, signal?: AbortSignal): Promise<number> {
      const r = await indexed("get_nft_balance_by_p2", { p2: withHexPrefix(p2) }, signal);
      return Number(r.confirmed_balance ?? 0);
    },

    async getCoinDetails(coinName: string, signal?: AbortSignal): Promise<CoinDetails> {
      const r = await indexed("get_coin_details", { coin_name: withHexPrefix(coinName), include_transactions: true }, signal);
      return normaliseCoinDetails(r);
    },

    async getSingletonInfo(launcherId: string, signal?: AbortSignal): Promise<SingletonInfo> {
      const r = await indexed("get_singleton_info", { launcher_id: withHexPrefix(launcherId) }, signal);
      return normaliseSingletonInfo(r);
    },

    async getLatestNftCoinByNftId(nftId: string, signal?: AbortSignal): Promise<Raw | null> {
      const r = await indexed("get_latest_nft_coin_by_nft_id", { nft_id: nftId }, signal);
      return r.nft_coin_record && typeof r.nft_coin_record === "object" ? (r.nft_coin_record as Raw) : null;
    },

    /* ---- offers, clawbacks, reorgs, raw transactions (Coinset only) ---- */

    async getOffer(offerId: string, signal?: AbortSignal): Promise<OfferState> {
      const r = await indexed("get_offer", { offer_id: offerId.replace(/^0x/, "") }, signal);
      return normaliseOfferState(notFoundIfMissing(r.state, "get_offer", "Offer"));
    },

    async getOffersByP2(p2: string, status: OfferStatus, opts: ListOptions = {}, signal?: AbortSignal): Promise<OfferList> {
      const r = await indexed("get_offers_by_p2", { p2: withHexPrefix(p2), status, order: "desc", ...opts }, signal);
      return normaliseOfferList(r);
    },

    async getOffersByCatAssetId(assetId: string, status: OfferStatus, opts: ListOptions = {}, signal?: AbortSignal): Promise<OfferList> {
      const r = await indexed("get_offers_by_cat_asset_id", { asset_id: withHexPrefix(assetId), status, filter: "all", order: "desc", ...opts }, signal);
      return normaliseOfferList(r);
    },

    async getOffersByNftId(nftId: string, status: OfferStatus, opts: ListOptions = {}, signal?: AbortSignal): Promise<OfferList> {
      const r = await indexed("get_offers_by_nft_id", { nft_id: nftId, status, filter: "all", order: "desc", ...opts }, signal);
      return normaliseOfferList(r);
    },

    async getClawbackCoinsByReceiver(p2: string, opts: ListOptions = {}, signal?: AbortSignal): Promise<ClawbackList> {
      const r = await indexed("get_clawback_coins_by_receiver", { p2: withHexPrefix(p2), order: "desc", ...opts }, signal);
      return normaliseClawbackList(r);
    },

    async getReorgs(opts: ListOptions = {}, signal?: AbortSignal): Promise<ReorgList> {
      const r = await indexed("get_reorgs", { limit: 50, ...opts }, signal);
      return normaliseReorgList(r);
    },

    /** Mempool-style item of a bundle even after it left the mempool (confirmed or inferred from the block). */
    async getRawTransactionById(txId: string, signal?: AbortSignal): Promise<RawTransaction> {
      const r = await indexed("get_raw_transaction_by_id", { tx_id: txId.replace(/^0x/, "") }, signal);
      return normaliseRawTransaction({ ...r, item: notFoundIfMissing(r.item, "get_raw_transaction_by_id", "Transaction") });
    },
  };
}

export type RpcClient = ReturnType<typeof createRpcClient>;

export interface CoinTxLinks {
  createdInTxId: string | null;
  spentInTxId: string | null;
  createdTransaction: TxSummary | null;
  spentTransaction: TxSummary | null;
}
