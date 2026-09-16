"use client";

import { useBlocksAssetTotals } from "@/widgets/block/useBlock";

import Link from "next/link";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useBlockchainState } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton, Table, Td, Th, Tr } from "@/shared/ui";

const PAGE = 25;

export function BlocksList() {
  const { client, endpoints } = useSettings();
  const state = useBlockchainState();
  const { peakHeight } = useLive();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  /** Highest height of the current page; null = follow the peak. */
  const [top, setTop] = useState<number | null>(null);
  const [txOnly, setTxOnly] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const end = top ?? peak;
  // Fetch a wider window when filtering so the page still fills with transaction blocks.
  const span = txOnly ? PAGE * 3 : PAGE;
  const start = end !== null ? Math.max(0, end - span + 1) : null;
  const query = useQuery({
    queryKey: queryKeys.blockRecords(endpoints.network, start ?? -1, (end ?? -1) + 1),
    enabled: end !== null,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => client.getBlockRecords(start!, end! + 1, signal),
  });
  const rows = [...(query.data ?? [])].sort((a, b) => b.height - a.height).filter((r) => !txOnly || r.isTransactionBlock).slice(0, PAGE);
  const totals = useBlocksAssetTotals(rows.filter((b) => b.isTransactionBlock).map((b) => ({ height: b.height, hash: b.headerHash })));
  const movedByHeight = new Map(rows.filter((b) => b.isTransactionBlock).map((b, i) => [b.height, totals[i]?.data ? formatAmount(BigInt(totals[i]!.data!.xch)) : null]));
  const oldestShown = rows[rows.length - 1]?.height ?? start;
  const now = Date.now();

  return (
    <Card>
      <CardHeader
        title={
          <span>
            Blocks{peak !== null ? <span className="tabular ml-2 normal-case tracking-normal text-fg-faint">peak {formatNumber(peak)}</span> : null}
          </span>
        }
        action={
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-fg-muted">
            <input type="checkbox" checked={txOnly} onChange={(e) => setTxOnly(e.target.checked)} className="accent-[var(--primary)]" />
            Transaction blocks only
          </label>
        }
      />
      <CardBody className="flex flex-col gap-3">
        {query.error ? (
          <EmptyState tone="danger" title="Could not load blocks" description={String((query.error as Error).message)} />
        ) : query.isLoading && rows.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Height</Th>
                <Th>Type</Th>
                <Th className="hidden sm:table-cell">Age</Th>
                <Th className="hidden text-right md:table-cell">Reward claims</Th>
                <Th className="text-right">Fees</Th>
                <Th className="hidden text-right md:table-cell">XCH moved</Th>
                <Th className="hidden lg:table-cell">Farmer</Th>
                <Th className="hidden xl:table-cell">Header hash</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <Tr key={b.height}>
                  <Td>
                    <Link href={routes.block(b.height)} className="tabular font-semibold text-accent hover:underline">
                      {formatNumber(b.height)}
                    </Link>
                  </Td>
                  <Td>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", b.isTransactionBlock ? "bg-primary-soft text-primary" : "bg-surface-2 text-fg-faint")}>
                      {b.isTransactionBlock ? "tx block" : "no tx"}
                    </span>
                  </Td>
                  <Td className="tabular hidden whitespace-nowrap text-fg-muted sm:table-cell">{b.timestamp ? formatAge(b.timestamp * 1000, now) : "—"}</Td>
                  <Td className="tabular hidden text-right text-fg-muted md:table-cell">{b.isTransactionBlock ? (b.rewardClaimsIncorporated?.length ?? 0) : "—"}</Td>
                  <Td className="tabular text-right">{b.isTransactionBlock ? formatAmount(b.fees ?? 0n) : <span className="text-fg-faint">—</span>}</Td>
                  <Td className="tabular hidden text-right text-fg-muted md:table-cell">{b.isTransactionBlock ? (movedByHeight.get(b.height) ?? <span className="text-fg-faint">…</span>) : <span className="text-fg-faint">—</span>}</Td>
                  <Td className="mono hidden text-xs text-fg-faint lg:table-cell" title={b.farmerPuzzleHash}>
                    {shortId(b.farmerPuzzleHash, 8, 4)}
                  </Td>
                  <Td className="mono hidden text-xs text-fg-faint xl:table-cell" title={b.headerHash}>
                    {shortId(b.headerHash, 10, 6)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="flex items-center justify-between gap-2 text-xs text-fg-faint">
          <span>
            {rows.length > 0 ? `Heights ${formatNumber(oldestShown ?? 0)} – ${formatNumber(rows[0]!.height)}` : ""}
            {query.isFetching ? " · updating…" : ""}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={top === null || peak === null} onClick={() => setTop((t) => (t === null || peak === null ? null : t + PAGE >= peak ? null : t + PAGE))}>
              Newer
            </Button>
            <Button size="sm" disabled={top !== null && top <= 0} onClick={() => setTop(peak)} className={top === null ? "hidden" : undefined}>
              Latest
            </Button>
            <Button size="sm" disabled={oldestShown === null || oldestShown === undefined || oldestShown <= 0} onClick={() => setTop((oldestShown ?? 1) - 1)}>
              Older
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
