import type { NetworkId } from "@/shared/config/networks";

/** Query keys are namespaced so live events can invalidate whole families at once. */
export const queryKeys = {
  chainRoot: (network: NetworkId) => ["chain", network] as const,
  state: (network: NetworkId) => ["chain", network, "state"] as const,
  blockRecords: (network: NetworkId, start: number, end: number) => ["chain", network, "records", start, end] as const,
  recentBlocks: (network: NetworkId, count: number, peak: number | null) => ["chain", network, "recent", count, peak] as const,
  blockRoot: (network: NetworkId) => ["chain", network, "block"] as const,
  block: (network: NetworkId, id: string) => ["chain", network, "block", id] as const,
  blockTxs: (network: NetworkId, height: number, cursor: string | null) => ["chain", network, "blockTxs", height, cursor] as const,
  blockSpends: (network: NetworkId, hash: string) => ["chain", network, "blockSpends", hash] as const,
  blockCoins: (network: NetworkId, hash: string) => ["chain", network, "blockCoins", hash] as const,
  fee: (network: NetworkId) => ["chain", network, "fee"] as const,
  mempoolRoot: (network: NetworkId) => ["mempool", network] as const,
  mempoolSummary: (network: NetworkId, source: string) => ["mempool", network, "summary", source] as const,
  mempoolItem: (network: NetworkId, id: string) => ["mempool", network, "item", id] as const,
  mempoolByCoin: (network: NetworkId, coin: string) => ["mempool", network, "byCoin", coin] as const,
  tx: (network: NetworkId, id: string) => ["tx", network, id] as const,
  coin: (network: NetworkId, id: string) => ["coin", network, id] as const,
  coinDetails: (network: NetworkId, id: string) => ["coin", network, id, "details"] as const,
  coinChildren: (network: NetworkId, id: string) => ["coin", network, id, "children"] as const,
  addressRoot: (network: NetworkId) => ["address", network] as const,
  address: (network: NetworkId, ph: string, part: string, cursor: string | null = null) =>
    ["address", network, ph, part, cursor] as const,
  cat: (network: NetworkId, id: string, part: string, cursor: string | null = null) => ["cat", network, id, part, cursor] as const,
  nft: (network: NetworkId, id: string, part: string, cursor: string | null = null) => ["nft", network, id, part, cursor] as const,
  search: (network: NetworkId, q: string) => ["search", network, q] as const,
};
