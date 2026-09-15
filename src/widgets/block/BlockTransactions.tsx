"use client";

import { useState } from "react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { feePerCost, formatAmount, formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { classifyCoinSpends } from "@/shared/lib/mempool/classify";
import { routes } from "@/shared/lib/routes";
import type { CoinSpend, TxSummary } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Amount, Button, Card, CardBody, CardHeader, Hash, KindBadge, Skeleton, SummaryKindBadge, Table, Td, Th, Tr } from "@/shared/ui";
import { BlockTreemap } from "./BlockTreemap";
import { txAmountMoved, useBlockSpends, useBlockTransactions } from "./useBlock";

export function BlockTransactions({ height, headerHash, blockCost, blockMaxCost, isTransactionBlock }: { height: number; headerHash: string; blockCost: number; blockMaxCost: number; isTransactionBlock: boolean }) {
  const { client } = useSettings();
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const pages = cursors.map((c) => c);
  // Fetch the latest page; earlier pages stay cached by their keys.
  const latest = pages[pages.length - 1] ?? null;
  const txQuery = useBlockTransactions(height, latest, isTransactionBlock);
  const spendsQuery = useBlockSpends(headerHash, isTransactionBlock && !client.hasIndexed);
  const [all, setAll] = useState<{ cursor: string | null; txs: TxSummary[] }[]>([]);

  // Accumulate pages as they resolve (keyed by cursor so re-renders do not duplicate).
  const known = new Map(all.map((p) => [p.cursor, p.txs]));
  if (txQuery.data && !known.has(latest)) {
    known.set(latest, txQuery.data.transactions);
    queueMicrotask(() => setAll([...known.entries()].map(([cursor, txs]) => ({ cursor, txs }))));
  }
  const transactions = cursors.flatMap((c) => known.get(c) ?? []);
  const nextCursor = txQuery.data?.nextCursor ?? null;

  if (!isTransactionBlock) return null;

  return (
    <Card>
      <CardHeader
        title={
          <span>
            Transactions
            {transactions.length > 0 ? <span className="tabular ml-2 text-fg-faint">{transactions.length}{nextCursor ? "+" : ""}</span> : null}
          </span>
        }
        action={<span className="text-xs text-fg-faint">{formatCost(blockCost)} of {formatCost(blockMaxCost)} cost</span>}
      />
      <CardBody className="flex flex-col gap-4">
        {client.hasIndexed ? (
          <>
            {txQuery.isLoading && transactions.length === 0 ? (
              <Skeleton className="h-[200px] w-full" />
            ) : transactions.length > 0 ? (
              <BlockTreemap transactions={transactions} blockCost={blockMaxCost} />
            ) : null}
            {txQuery.isLoading && transactions.length === 0 ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-faint">
                {txQuery.error ? "Coinset has not indexed this block's transactions." : "This transaction block carries no spend bundles (only farmer and pool rewards)."}
              </p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Tx id</Th>
                    <Th>Kind</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="hidden text-right sm:table-cell">Fee</Th>
                    <Th className="hidden text-right md:table-cell">Cost</Th>
                    <Th className="hidden text-right md:table-cell">Fee / cost</Th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <Tr key={tx.id}>
                      <Td>
                        <Hash value={tx.id} href={routes.tx(tx.id)} />
                      </Td>
                      <Td>
                        <SummaryKindBadge kind={tx.kind} />
                      </Td>
                      <Td className="text-right">
                        <Amount mojos={txAmountMoved(tx)} />
                      </Td>
                      <Td className="tabular hidden text-right sm:table-cell">{formatAmount(tx.feeMojos)}</Td>
                      <Td className="tabular hidden text-right md:table-cell">{formatCost(tx.cost)}</Td>
                      <Td className="tabular hidden text-right md:table-cell">{formatFeeRate(feePerCost(tx.feeMojos, tx.cost))}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
            {nextCursor ? (
              <div className="flex justify-center">
                <Button size="sm" disabled={txQuery.isFetching} onClick={() => setCursors((c) => [...c, nextCursor])}>
                  {txQuery.isFetching ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <SpendList spends={spendsQuery.data} loading={spendsQuery.isLoading} />
        )}
      </CardBody>
    </Card>
  );
}

/** RPC-only fallback: individual coin spends (the node does not expose bundle boundaries). */
function SpendList({ spends, loading }: { spends: CoinSpend[] | undefined; loading: boolean }) {
  const { networkConfig } = useSettings();
  const [limit, setLimit] = useState(100);
  if (loading || !spends) return <Skeleton className="h-24 w-full" />;
  const shown = spends.slice(0, limit);
  return (
    <>
      <p className="rounded-sm border border-border bg-bg px-3 py-2 text-xs text-fg-muted">
        Semantic transaction summaries need Coinset. With a custom node the block's {spends.length} coin spends are listed individually, with a kind guessed from each puzzle.
      </p>
      <Table>
        <thead>
          <tr>
            <Th>Spent coin</Th>
            <Th>Kind</Th>
            <Th className="hidden sm:table-cell">Address</Th>
            <Th className="text-right">Amount</Th>
          </tr>
        </thead>
        <tbody>
          {shown.map((cs, i) => {
            const address = puzzleHashToAddress(cs.coin.puzzleHash, networkConfig.addressPrefix);
            return (
              <Tr key={`${cs.coin.parentCoinInfo}-${i}`}>
                <Td>
                  <Hash value={cs.coin.parentCoinInfo} head={6} tail={4} />
                  <span className="ml-1 text-xs text-fg-faint">(parent)</span>
                </Td>
                <Td>
                  <KindBadge kind={classifyCoinSpends([cs]).kind} />
                </Td>
                <Td className="hidden sm:table-cell">
                  <Hash value={address} href={routes.address(address)} head={10} tail={6} />
                </Td>
                <Td className="text-right">
                  <Amount mojos={cs.coin.amount} />
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {spends.length > shown.length ? (
        <Button size="sm" className="self-center" onClick={() => setLimit((l) => l + 100)}>
          Show more ({spends.length - shown.length} left)
        </Button>
      ) : null}
    </>
  );
}
