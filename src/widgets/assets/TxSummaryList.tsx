"use client";

import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
import Link from "next/link";
import { formatAmount, formatCat, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import type { TxSummary } from "@/shared/lib/rpc/types";
import { Button, EmptyState, Hash, Skeleton, StatusBadge, SummaryKindBadge } from "@/shared/ui";
import { deriveAddressFlow } from "@/widgets/address/deriveFlow";
import { tokenLabel, type TokenMap } from "./tokenList";

export interface TxSummaryListProps {
  transactions: TxSummary[];
  loading: boolean;
  error?: unknown;
  /** When set, each row shows the net change for this puzzle hash. */
  viewedP2?: string;
  tokens?: TokenMap;
  emptyText: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

function Direction({ dir }: { dir: "in" | "out" | "self" | "none" }) {
  if (dir === "in") return <ArrowDownLeft size={14} className="text-primary" aria-label="incoming" />;
  if (dir === "out") return <ArrowUpRight size={14} className="text-danger" aria-label="outgoing" />;
  if (dir === "self") return <Repeat size={14} className="text-fg-faint" aria-label="self" />;
  return null;
}

function signed(amount: bigint, format: (v: bigint) => string): string {
  const abs = amount < 0n ? -amount : amount;
  return `${amount > 0n ? "+" : amount < 0n ? "−" : ""}${format(abs)}`;
}

export function TxSummaryList({ transactions, loading, error, viewedP2, tokens, emptyText, hasMore, onLoadMore, loadingMore }: TxSummaryListProps) {
  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }
  if (error && transactions.length === 0) {
    return <EmptyState tone="danger" title="Could not load transactions" description={error instanceof Error ? error.message : String(error)} />;
  }
  if (transactions.length === 0) return <EmptyState title={emptyText} />;
  return (
    <div className="flex flex-col gap-2">
      <ul className="divide-y divide-border/60">
        {transactions.map((tx) => {
          const flow = viewedP2 ? deriveAddressFlow(tx, viewedP2) : null;
          const when = tx.confirmedAtMs ?? tx.firstSeenMs;
          return (
            <li key={tx.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
              {flow ? <Direction dir={flow.direction} /> : null}
              <Hash value={tx.id} href={routes.tx(tx.id)} head={8} tail={6} />
              <SummaryKindBadge kind={tx.kind} />
              {tx.status !== "confirmed" ? <StatusBadge status={tx.status} /> : null}
              <span className="ml-auto flex flex-col items-end gap-0.5 text-right">
                {flow ? (
                  <>
                    {flow.xch !== 0n ? (
                      <span className={cn("tabular font-medium", flow.xch > 0n ? "text-primary" : "text-danger")}>{signed(flow.xch, formatAmount)}</span>
                    ) : null}
                    {flow.cats.map((c) => (
                      <Link key={c.assetId} href={routes.cat(c.assetId)} className={cn("tabular text-xs hover:underline", c.amount > 0n ? "text-primary" : "text-danger")}>
                        {signed(c.amount, formatCat)} {tokens?.[c.assetId]?.symbol ?? tokenLabel(undefined, c.assetId)}
                      </Link>
                    ))}
                    {flow.nftsIn.map((n) => (
                      <Link key={n} href={routes.nft(n)} className="text-xs text-primary hover:underline">
                        +1 NFT {n.slice(0, 8)}…
                      </Link>
                    ))}
                    {flow.nftsOut.map((n) => (
                      <Link key={n} href={routes.nft(n)} className="text-xs text-danger hover:underline">
                        −1 NFT {n.slice(0, 8)}…
                      </Link>
                    ))}
                    {flow.xch === 0n && flow.cats.length === 0 && flow.nftsIn.length === 0 && flow.nftsOut.length === 0 ? (
                      <span className="text-xs text-fg-faint">no net change</span>
                    ) : null}
                  </>
                ) : (
                  <span className="tabular text-fg-muted">fee {formatAmount(tx.feeMojos)}</span>
                )}
              </span>
              <span className="tabular w-[7.5rem] text-right text-xs text-fg-faint">
                {tx.confirmedHeight ? (
                  <Link href={routes.block(tx.confirmedHeight)} className="hover:underline">
                    #{formatNumber(tx.confirmedHeight)}
                  </Link>
                ) : (
                  "pending"
                )}
                {when ? <span className="block">{formatAge(when)}</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
      {hasMore && onLoadMore ? (
        <Button variant="secondary" size="sm" onClick={onLoadMore} disabled={loadingMore} className="self-center">
          {loadingMore ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
