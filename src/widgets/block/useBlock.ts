"use client";

import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  assetTotalsFromSpends,
  assetTotalsFromSummaries,
  type BlockAssetTotals,
} from "@/shared/lib/blocks/assetTotals";
import { loadCachedTotals, saveCachedTotals } from "@/shared/lib/blocks/totalsCache";
import { queryKeys } from "@/shared/api/queryKeys";
import { isHex, stripHexPrefix } from "@/shared/lib/chia/hex";
import type { BlockRecord, FullBlockSummary, TxSummary, TxList } from "@/shared/lib/rpc/types";
import type { RpcClient } from "@/shared/lib/rpc/client";
import type { NetworkId } from "@/shared/config/networks";
import { createLimiter } from "@/shared/lib/limit";
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

/**
 * The block page asks for the record and the full block separately: the record is one small
 * call and carries nearly everything the page shows, the full block (a few hundred KB with the
 * generator) only adds the cost, so the page paints on the record and fills the rest in.
 */
export function useBlockRecord(id: string) {
  const { client, endpoints } = useSettings();
  const parsed = parseBlockId(id);
  return useQuery({
    queryKey: queryKeys.blockRecord(endpoints.network, id.trim().toLowerCase()),
    enabled: parsed !== null,
    queryFn: ({ signal }): Promise<BlockRecord> =>
      parsed && "height" in parsed
        ? client.getBlockRecordByHeight(parsed.height, signal)
        : client.getBlockRecord(parsed!.hash, signal),
  });
}

export function useFullBlock(hash: string | null) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: [...queryKeys.block(endpoints.network, hash ?? ""), "full"],
    enabled: hash !== null,
    queryFn: ({ signal }) => client.getBlock(hash!, signal),
  });
}

export function useBlockTransactions(
  height: number | null,
  cursor: string | null,
  enabled: boolean
) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.blockTxs(endpoints.network, height ?? -1, cursor),
    enabled: enabled && height !== null && client.hasIndexed,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      client.getBlockTransactions(height!, { limit: 50, ...(cursor ? { cursor } : {}) }, signal),
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
      return (
        records.filter((r) => r.isTransactionBlock).sort((a, b) => a.height - b.height)[0] ?? null
      );
    },
  });
}

/** Total XCH moved by a Coinset transaction summary (sum of what participants received). */
const TOTALS_PAGES = 4;

/** At most this many per-block indexed calls in flight per tab (recent cubes + blocks list). */
const blockTotalsLimit = createLimiter(3);
/**
 * A block's spends carry every puzzle reveal (megabytes for a full block): one at a time, so
 * that they never take the connection slots the page's own data needs.
 */
const blockSpendsLimit = createLimiter(1);

/**
 * The cubes' totals are decoration: they wait until the page around them has loaded (the
 * browser is idle, or this long at most) instead of competing with it for the first paint.
 */
const TOTALS_DEFER_MS = 2_500;

function useAfterFirstPaint(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const done = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(done, { timeout: TOTALS_DEFER_MS });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(done, TOTALS_DEFER_MS);
    return () => window.clearTimeout(id);
  }, []);
  return ready;
}

function browserStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Where a block's totals come from: a nodexch gateway's loop sums them itself (TASK-150) and
 * the dashboard call and the block frames seed them (src/shared/api/hooks.ts); Coinset's
 * summaries otherwise, or the block's spends on a bare node.
 */
function totalsSource(client: RpcClient): BlockAssetTotals["source"] {
  return client.metered ? "gateway" : client.hasIndexed ? "coinset" : "rpc";
}

/**
 * The cached totals for `source`. A gateway's block that its loop did not read (a lean budget
 * with no room) falls back to Coinset's summaries through the gateway, so a cached one of those
 * counts too.
 */
function cachedTotals(
  network: NetworkId,
  hash: string,
  source: BlockAssetTotals["source"]
): BlockAssetTotals | null {
  const own = loadCachedTotals(browserStorage(), network, hash, source);
  if (own || source !== "gateway") return own;
  return loadCachedTotals(browserStorage(), network, hash, "coinset");
}

/** Per-asset totals of one block: the gateway's, Coinset summaries (up to 4 pages of 50) or the block's spends. */
export function useBlockAssetTotals(height: number | null, hash: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  const source = totalsSource(client);
  return useQuery({
    queryKey: queryKeys.blockTotals(endpoints.network, height ?? -1, hash ?? "", source, "detail"),
    enabled: enabled && height !== null && hash !== null,
    staleTime: Infinity,
    queryFn: async ({ signal }): Promise<BlockAssetTotals> => {
      const block = { height: height!, hash: hash! };
      // A first-page total from the cubes is not good enough for the block page; the gateway's
      // totals cover the whole block.
      const cached = cachedTotals(endpoints.network, block.hash, source);
      if (cached && !cached.partial) return cached;
      const keep = (totals: BlockAssetTotals) => {
        saveCachedTotals(browserStorage(), endpoints.network, block, totals);
        return totals;
      };
      if (client.hasIndexed) {
        const txs: TxSummary[] = [];
        let cursor: string | null = null;
        let partial = false;
        for (let page = 0; page < TOTALS_PAGES; page += 1) {
          const c = cursor;
          const list: TxList = await blockTotalsLimit(() =>
            client.getBlockTransactions(height!, { limit: 50, ...(c ? { cursor: c } : {}) }, signal)
          );
          txs.push(...list.transactions);
          cursor = list.nextCursor;
          if (!cursor) break;
          if (page === TOTALS_PAGES - 1) partial = true;
        }
        return keep(assetTotalsFromSummaries(txs, partial));
      }
      return keep(
        assetTotalsFromSpends(await blockSpendsLimit(() => client.getBlockSpends(hash!, signal)))
      );
    },
  });
}

/** Totals for several blocks at once (recent-block cubes, blocks list); first page of each only. */
export function useBlocksAssetTotals(blocks: { height: number; hash: string }[]) {
  const { client, endpoints } = useSettings();
  const ready = useAfterFirstPaint();
  const source = totalsSource(client);
  return useQueries({
    queries: blocks.map((b) => ({
      queryKey: queryKeys.blockTotals(endpoints.network, b.height, b.hash, source, "preview"),
      enabled: ready,
      staleTime: Infinity,
      // Totals this browser already has show at once; only missing ones wait for the fetch.
      initialData: () => cachedTotals(endpoints.network, b.hash, source) ?? undefined,
      queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<BlockAssetTotals> => {
        const cached = cachedTotals(endpoints.network, b.hash, source);
        if (cached) return cached;
        const keep = (totals: BlockAssetTotals) => {
          saveCachedTotals(browserStorage(), endpoints.network, b, totals);
          return totals;
        };
        if (client.hasIndexed) {
          const list = await blockTotalsLimit(() =>
            client.getBlockTransactions(b.height, { limit: 50 }, signal)
          );
          return keep(assetTotalsFromSummaries(list.transactions, list.nextCursor !== null));
        }
        return keep(
          assetTotalsFromSpends(await blockSpendsLimit(() => client.getBlockSpends(b.hash, signal)))
        );
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
