"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { isHex, stripHexPrefix } from "@/shared/lib/chia/hex";
import type { BlockRecord, FullBlockSummary, TxSummary } from "@/shared/lib/rpc/types";
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
export function txAmountMoved(tx: TxSummary): bigint {
  return tx.events.reduce(
    (sum, e) => sum + e.participants.reduce((s, p) => s + p.received.xch, 0n),
    0n
  );
}
