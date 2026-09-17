"use client";

import { useMemo, useState } from "react";
import { useTokenList } from "@/shared/api/useTokenList";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import type { TokenActivitySample } from "@/shared/lib/tokens/activity";
import type { TokenInfo } from "@/shared/api/tokenList";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { AssetIcon } from "@/shared/ui/AssetBadge";
import { Button, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton, Table, Td, Th, Tr } from "@/shared/ui";
import { RECENT_SAMPLE, useTokenActivity } from "./useTokenActivity";
import { SCAN_LIMIT, useTokenScan } from "./useTokenScan";

const PAGE = 25;

type SortMode = "name" | "active" | "volume" | "recent" | "newest";

const SORTS: readonly { id: SortMode; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "active", label: "Most active" },
  { id: "volume", label: "Volume" },
  { id: "recent", label: "Recently active" },
  { id: "newest", label: "Newest" },
];

function ActivityCells({ sample, loading }: { sample: TokenActivitySample | null; loading: boolean }) {
  if (loading && !sample) {
    return (
      <>
        <Td className="text-right">
          <Skeleton className="ml-auto h-4 w-10" />
        </Td>
        <Td className="hidden text-right md:table-cell">
          <Skeleton className="ml-auto h-4 w-20" />
        </Td>
        <Td className="hidden lg:table-cell">
          <Skeleton className="h-4 w-24" />
        </Td>
        <Td className="hidden lg:table-cell">
          <Skeleton className="h-4 w-24" />
        </Td>
      </>
    );
  }
  if (!sample) {
    return (
      <>
        <Td className="text-right text-fg-faint">—</Td>
        <Td className="hidden text-right text-fg-faint md:table-cell">—</Td>
        <Td className="hidden text-fg-faint lg:table-cell">—</Td>
        <Td className="hidden text-fg-faint lg:table-cell">—</Td>
      </>
    );
  }
  return (
    <>
      <Td className="tabular text-right">
        {formatNumber(sample.sampledSpends)}
        {sample.capped ? "+" : ""}
      </Td>
      <Td className="tabular hidden text-right md:table-cell">{sample.sampledVolume > 0n ? `${formatAmount(sample.sampledVolume, "cat")}+` : "—"}</Td>
      <Td className="hidden text-xs text-fg-muted lg:table-cell">{sample.firstSeenMs ? formatDateTime(sample.firstSeenMs) : "—"}</Td>
      <Td className="hidden text-xs text-fg-muted lg:table-cell">{sample.lastSeenMs ? formatAge(sample.lastSeenMs) : "—"}</Td>
    </>
  );
}

function NameRow({ token }: { token: TokenInfo }) {
  const activity = useTokenActivity(token.assetId, true);
  return (
    <Tr>
      <Td>
        <a href={routes.cat(token.assetId)} className="flex min-w-0 items-center gap-2 text-fg hover:text-accent">
          <AssetIcon kind="cat" assetId={token.assetId} size={22} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{token.name}</span>
            <span className="text-xs text-fg-faint">{token.symbol}</span>
          </span>
        </a>
      </Td>
      <Td className="hidden xl:table-cell">
        <Hash value={token.assetId} href={routes.cat(token.assetId)} head={8} tail={6} copy />
      </Td>
      <ActivityCells sample={activity.data} loading={activity.isLoading} />
    </Tr>
  );
}

function ScannedRow({ token, sample }: { token: TokenInfo; sample: TokenActivitySample | null }) {
  return (
    <Tr>
      <Td>
        <a href={routes.cat(token.assetId)} className="flex min-w-0 items-center gap-2 text-fg hover:text-accent">
          <AssetIcon kind="cat" assetId={token.assetId} size={22} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{token.name}</span>
            <span className="text-xs text-fg-faint">{token.symbol}</span>
          </span>
        </a>
      </Td>
      <Td className="hidden xl:table-cell">
        <Hash value={token.assetId} href={routes.cat(token.assetId)} head={8} tail={6} copy />
      </Td>
      <ActivityCells sample={sample} loading={false} />
    </Tr>
  );
}

export function TokensPage() {
  const { client } = useSettings();
  const tokens = useTokenList();
  const scan = useTokenScan(client);
  const [sort, setSort] = useState<SortMode>("name");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const allTokens = useMemo(() => Object.values(tokens.data ?? {}).sort((a, b) => a.name.localeCompare(b.name)), [tokens.data]);
  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? allTokens.filter((t) => t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q) || t.assetId.includes(q)) : allTokens),
    [allTokens, q]
  );

  const scoreOf = (t: TokenInfo): number | null => {
    const s = scan.results.get(t.assetId);
    if (!s) return null;
    if (sort === "active") return s.sampledSpends;
    if (sort === "volume") return Number(s.sampledVolume);
    if (sort === "recent") return s.lastSeenMs ?? -1;
    if (sort === "newest") return s.firstSeenMs ?? -1;
    return null;
  };

  const ordered = useMemo(() => {
    if (sort === "name") return filtered;
    return [...filtered].sort((a, b) => {
      const sa = scoreOf(a);
      const sb = scoreOf(b);
      if (sa === null && sb === null) return a.name.localeCompare(b.name);
      if (sa === null) return 1;
      if (sb === null) return -1;
      return sb - sa || a.name.localeCompare(b.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, sort, scan.results]);

  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE));
  const clampedPage = Math.min(page, pageCount - 1);
  const visible = ordered.slice(clampedPage * PAGE, clampedPage * PAGE + PAGE);

  const needsScan = sort !== "name" && !scan.scanning && scan.results.size === 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Tokens</h1>
        <p className="text-sm text-fg-muted">
          Every CAT the Dexie registry knows a name for, {formatNumber(allTokens.length)} in total. Activity figures come from Coinset&apos;s{" "}
          <span className="mono">get_transactions_by_cat_asset_id</span> per asset on request — first seen is exact, spends and volume are a sample of the
          most recent {RECENT_SAMPLE} transfers (marked with a + when there are more), nothing kept on our server (decision-012).
        </p>
      </header>

      <Card>
        <CardHeader
          title="Tokens"
          action={
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
                scan.reset();
              }}
              placeholder="Search name, ticker or asset id"
              aria-label="Search tokens"
              className="h-8 w-48 rounded-sm border border-border bg-surface px-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none sm:w-64"
            />
          }
        />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">Sort</span>
            <div role="radiogroup" aria-label="Sort" className="flex flex-wrap gap-1">
              {SORTS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={sort === opt.id}
                  onClick={() => {
                    setSort(opt.id);
                    setPage(0);
                  }}
                  className={cn(
                    "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
                    sort === opt.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-bg text-fg-muted hover:text-fg"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {needsScan ? (
            <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-bg p-3 text-sm">
              <p className="text-fg-muted">
                Sorting by {SORTS.find((s) => s.id === sort)?.label.toLowerCase()} needs each token&apos;s activity, fetched on request. Scans up to{" "}
                {formatNumber(Math.min(SCAN_LIMIT, filtered.length))} of the {formatNumber(filtered.length)} tokens currently listed
                {filtered.length > SCAN_LIMIT ? " (search to narrow the list for an exact scan)" : ""}.
              </p>
              <Button
                size="sm"
                onClick={() =>
                  scan.scan(
                    filtered.map((t) => t.assetId),
                  )
                }
              >
                Scan tokens
              </Button>
            </div>
          ) : null}
          {scan.scanning ? (
            <div className="flex flex-col gap-1 text-xs text-fg-faint">
              <div className="flex items-center justify-between">
                <span>
                  Scanning… {formatNumber(scan.done)} of {formatNumber(scan.total)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-label="Scan progress" aria-valuemin={0} aria-valuemax={scan.total} aria-valuenow={scan.done}>
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${scan.total > 0 ? (scan.done / scan.total) * 100 : 0}%` }} />
              </div>
            </div>
          ) : null}

          {tokens.error ? (
            <EmptyState tone="danger" title="Could not load the token registry" description={String((tokens.error as Error).message)} />
          ) : tokens.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : ordered.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">No token matches &quot;{search}&quot;.</p>
          ) : (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tokens">
              <Table>
                <thead>
                  <tr>
                    <Th>Token</Th>
                    <Th className="hidden xl:table-cell">Asset id</Th>
                    <Th className="text-right">Spends</Th>
                    <Th className="hidden text-right md:table-cell">Volume moved</Th>
                    <Th className="hidden lg:table-cell">First seen</Th>
                    <Th className="hidden lg:table-cell">Last seen</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) =>
                    sort === "name" ? <NameRow key={t.assetId} token={t} /> : <ScannedRow key={t.assetId} token={t} sample={scan.results.get(t.assetId) ?? null} />
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {ordered.length > PAGE ? (
            <div className="flex items-center justify-between gap-2 text-xs text-fg-faint">
              <span>
                {formatNumber(clampedPage * PAGE + 1)}–{formatNumber(Math.min(ordered.length, (clampedPage + 1) * PAGE))} of {formatNumber(ordered.length)}
              </span>
              <div className="flex gap-2">
                <Button size="sm" disabled={clampedPage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  Previous
                </Button>
                <Button size="sm" disabled={clampedPage >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
