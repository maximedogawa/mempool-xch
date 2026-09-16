"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { assetTotalsFromSpends, assetTotalsFromSummaries, type BlockAssetTotals } from "@/shared/lib/blocks/assetTotals";
import { queryKeys } from "@/shared/api/queryKeys";
import { isHex, stripHexPrefix } from "@/shared/lib/chia/hex";
import type { BlockRecord, FullBlockSummary, TxSummary, TxList } from "@/shared/lib/rpc/types";
import { createLimiter } from "@/shared/lib/limit";
import { fetchChainSnapshot, isChainFallbackError } from "@/shared/api/chain";
import { RpcError } from "@/shared/lib/rpc/errors";
import { useSettings } from "@/shared/providers/SettingsProvider";

export interface BlockData {
  record: BlockRecord;
  block: FullBlockSummary;
}

/** Height (digits) or 32-byte header hash. */
export function parseBlockId(id: string): { height: number } | { hash: string } | null {
  const v = id.trim();
  if (/^\d{1,9}$/.test(v)) return { height: Number(v) };
  if (isHex(v, 32)) return { hash: stripHexPrefix(v) };
  return null;
}

export function useBlock(id: string) {
  const { client, endpoints } = useSettings();
  const parsed = parseBlockId(id);
  return useQuery({
    queryKey: queryKeys.block(endpoints.network, id.trim().toLowerCase()),
    enabled: parsed !== null,
    queryFn: async ({ signal }): Promise<BlockData> => {
      const record =
        parsed && "height" in parsed
          ? await client.getBlockRecordByHeight(parsed.height, signal)
          : await client.getBlockRecord(parsed!.hash, signal);
      const block = await client.getBlock(record.headerHash, signal);
      return { record, block };
    },
  });
}

export function useBlockTransactions(height: number | null, cursor: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.blockTxs(endpoints.network, height ?? -1, cursor),
    enabled: enabled && height !== null && client.hasIndexed,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => client.getBlockTransactions(height!, { limit: 50, ...(cursor ? { cursor } : {}) }, signal),
  });
}

export function useBlockSpends(hash: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.blockSpends(endpoints.network, hash ?? ""),
    enabled: enabled && hash !== null,
    queryFn: ({ signal }) => client.getBlockSpends(hash!, signal),
  });
}

export function useBlockCoins(hash: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.blockCoins(endpoints.network, hash ?? ""),
    enabled: enabled && hash !== null,
    queryFn: ({ signal }) => client.getAdditionsAndRemovals(hash!, signal),
  });
}

/** First transaction block after `height`, scanning a short window forward. */
export function useNextTransactionBlock(height: number | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.blockRecords(endpoints.network, (height ?? 0) + 1, (height ?? 0) + 41),
    enabled: enabled && height !== null,
    queryFn: async ({ signal }): Promise<BlockRecord | null> => {
      const records = await client.getBlockRecords(height! + 1, height! + 41, signal);
      return records.filter((r) => r.isTransactionBlock).sort((a, b) => a.height - b.height)[0] ?? null;
    },
  });
}

/** Total XCH moved by a Coinset transaction summary (sum of what participants received). */
const TOTALS_PAGES = 4;

/** At most this many per-block indexed calls in flight per tab (recent cubes + blocks list). */
const blockTotalsLimit = createLimiter(3);

/** Per-asset totals of one block: Coinset summaries (up to 4 pages of 50) or the block's spends. */
export function useBlockAssetTotals(height: number | null, hash: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: [...queryKeys.blockRoot(endpoints.network), "assetTotals", height ?? -1, client.hasIndexed ? "coinset" : "rpc"],
    enabled: enabled && height !== null && hash !== null,
    staleTime: Infinity,
    queryFn: async ({ signal }): Promise<BlockAssetTotals> => {
      if (client.hasIndexed) {
        const txs: TxSummary[] = [];
        let cursor: string | null = null;
        let partial = false;
        for (let page = 0; page < TOTALS_PAGES; page += 1) {
          const c = cursor;
          const list: TxList = await blockTotalsLimit(() => client.getBlockTransactions(height!, { limit: 50, ...(c ? { cursor: c } : {}) }, signal));
          txs.push(...list.transactions);
          cursor = list.nextCursor;
          if (!cursor) break;
          if (page === TOTALS_PAGES - 1) partial = true;
        }
        return assetTotalsFromSummaries(txs, partial);
      }
      return assetTotalsFromSpends(await client.getBlockSpends(hash!, signal));
    },
  });
}

/** Totals for several blocks at once (recent-block cubes, blocks list); first page of each only. */
export function useBlocksAssetTotals(blocks: { height: number; hash: string }[]) {
  const { client, endpoints } = useSettings();
  return useQueries({
    queries: blocks.map((b) => ({
      queryKey: [...queryKeys.blockRoot(endpoints.network), "assetTotals", b.height, client.hasIndexed ? "coinset" : "rpc"],
      staleTime: Infinity,
      queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<BlockAssetTotals> => {
        // Hosted: the server fetches each block's summaries once for everyone and announces
        // them with a `chain` event (LiveProvider refetches this query then). Until that, the
        // cube shows no totals rather than every tab asking Coinset itself.
        if (endpoints.chainUrl) {
          try {
            const snapshot = await fetchChainSnapshot(endpoints.chainUrl, signal);
            const cached = snapshot.assets[String(b.height)];
            if (cached) return cached;
            if (snapshot.blocks.some((r) => r.height === b.height) || (snapshot.blocks[0]?.height ?? 0) < b.height) {
              throw new RpcError("not_found", "chain", "Asset totals not cached yet");
            }
          } catch (error) {
            if (!isChainFallbackError(error)) throw error;
          }
        }
        if (client.hasIndexed) {
          const list = await blockTotalsLimit(() => client.getBlockTransactions(b.height, { limit: 50 }, signal));
          return assetTotalsFromSummaries(list.transactions, list.nextCursor !== null);
        }
        return assetTotalsFromSpends(await client.getBlockSpends(b.hash, signal));
      },
    })),
  });
}

export function txAmountMoved(tx: TxSummary): bigint {
  return tx.events.reduce(
    (sum, e) => sum + e.participants.reduce((s, p) => s + p.received.xch, 0n),
    0n
  );
}
