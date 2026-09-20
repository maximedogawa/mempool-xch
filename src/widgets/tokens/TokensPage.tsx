"use client";

import { useMemo, useState } from "react";
import { useTokenList } from "@/shared/api/useTokenList";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import {
  buildTokenRows,
  countByFilter,
  listTokens,
  type TokenFilter,
  type TokenRow,
  type TokenSort,
} from "@/shared/lib/tokens/listing";
import { formatXchFigure, type VolumeWindow } from "@/shared/lib/tokens/markets";
import { AssetIcon } from "@/shared/ui/AssetBadge";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useTokenMarkets } from "./useTokenMarkets";

const PAGE = 25;

const WINDOWS: readonly { id: VolumeWindow; label: string; long: string }[] = [
  { id: "d1", label: "24h", long: "24 hours" },
  { id: "d7", label: "7d", long: "7 days" },
  { id: "d30", label: "30d", long: "30 days" },
];

const FILTERS: readonly { id: TokenFilter; label: string }[] = [
  { id: "traded", label: "Traded" },
  { id: "liquid", label: "With liquidity" },
  { id: "priced", label: "Priced" },
  { id: "all", label: "All" },
];

const SORTS: readonly { id: TokenSort; label: string }[] = [
  { id: "volume", label: "Volume" },
  { id: "liquidity", label: "Liquidity" },
  { id: "price", label: "Price" },
  { id: "name", label: "Name" },
];

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string; count?: number }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={value === opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
              value === opt.id
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-bg text-fg-muted hover:text-fg"
            )}
          >
            {opt.label}
            {opt.count !== undefined ? (
              <span className="tabular ml-1.5 font-normal opacity-70">
                {formatNumber(opt.count)}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function Figure({ value, loading }: { value: number | null; loading: boolean }) {
  if (loading) return <Skeleton className="ml-auto h-4 w-14" />;
  if (value === null || value === 0) return <span className="text-fg-faint">—</span>;
  return <>{formatXchFigure(value)}</>;
}

function TokenTableRow({
  row,
  period,
  marketsLoading,
}: {
  row: TokenRow;
  period: VolumeWindow;
  marketsLoading: boolean;
}) {
  const { token, market } = row;
  return (
    <Tr>
      <Td>
        <a
          href={routes.cat(token.assetId)}
          className="flex min-w-0 items-center gap-2 text-fg hover:text-accent"
        >
          <AssetIcon kind="cat" assetId={token.assetId} size={22} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{token.name}</span>
            <span className="text-xs text-fg-faint">{token.symbol}</span>
          </span>
        </a>
      </Td>
      <Td className="tabular text-right">
        <Figure value={market?.lastPriceXch ?? null} loading={marketsLoading} />
      </Td>
      {WINDOWS.map((w) => (
        <Td
          key={w.id}
          className={cn(
            "tabular text-right",
            w.id === period ? "font-medium text-fg" : "hidden text-fg-muted md:table-cell"
          )}
        >
          <Figure value={market?.volumeXch[w.id] ?? null} loading={marketsLoading} />
        </Td>
      ))}
      <Td className="tabular hidden text-right sm:table-cell">
        <Figure value={row.liquidityXch} loading={false} />
      </Td>
    </Tr>
  );
}

export function TokensPage() {
  const tokens = useTokenList();
  const markets = useTokenMarkets();
  const [filter, setFilter] = useState<TokenFilter>("traded");
  const [sort, setSort] = useState<TokenSort>("volume");
  const [period, setPeriod] = useState<VolumeWindow>("d30");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const rows = useMemo(
    () => buildTokenRows(Object.values(tokens.data ?? {}), markets.data ?? {}),
    [tokens.data, markets.data]
  );
  const counts = useMemo(() => countByFilter(rows, period), [rows, period]);
  // Without market data nothing is "traded": show the whole registry rather than an empty table.
  const marketsMissing = !markets.data && !markets.isLoading;
  const activeFilter: TokenFilter = marketsMissing && filter !== "liquid" ? "all" : filter;
  const ordered = useMemo(
    () => listTokens(rows, { filter: activeFilter, sort, window: period, search }),
    [rows, activeFilter, sort, period, search]
  );

  const pageCount = Math.max(1, Math.ceil(ordered.length / PAGE));
  const clampedPage = Math.min(page, pageCount - 1);
  const visible = ordered.slice(clampedPage * PAGE, clampedPage * PAGE + PAGE);
  const windowLong = WINDOWS.find((w) => w.id === period)!.long;
  const loading = tokens.isLoading || (markets.isLoading && filter !== "all");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Tokens</h1>
          <Tooltip
            text={`Every CAT the Dexie registry knows a name for, ${formatNumber(rows.length)} in total. Price, volume and liquidity are Dexie market data, all in XCH so tokens compare with each other: volume is the XCH traded against the token, liquidity the XCH side of its open offers (refreshed daily). One request covers every token's market data, nothing kept on our server. On-chain history is on each token's page.`}
            placement="bottom"
          />
        </div>
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
              }}
              placeholder="Search name, ticker or asset id"
              aria-label="Search tokens"
              className="h-8 w-48 rounded-sm border border-border bg-surface px-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none sm:w-64"
            />
          }
        />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Choice
              label="Show"
              value={activeFilter}
              options={FILTERS.map((f) => ({
                ...f,
                label:
                  f.id === "traded"
                    ? `Traded in ${WINDOWS.find((w) => w.id === period)!.label}`
                    : f.label,
                count:
                  markets.data || f.id === "all" || f.id === "liquid" ? counts[f.id] : undefined,
              }))}
              onChange={(id) => {
                setFilter(id);
                setPage(0);
              }}
            />
            <Choice
              label="Period"
              value={period}
              options={WINDOWS}
              onChange={(id) => {
                setPeriod(id);
                setPage(0);
              }}
            />
            <Choice
              label="Sort"
              value={sort}
              options={SORTS}
              onChange={(id) => {
                setSort(id);
                setPage(0);
              }}
            />
          </div>

          {markets.error ? (
            <p className="rounded-sm border border-border bg-bg p-3 text-sm text-fg-muted">
              Dexie market data is unavailable right now, so prices and volume are missing.{" "}
              <button
                type="button"
                className="font-medium text-accent hover:underline"
                onClick={() => void markets.refetch()}
              >
                Try again
              </button>
            </p>
          ) : null}

          {tokens.error ? (
            <EmptyState
              tone="danger"
              title="Could not load the token registry"
              description={String((tokens.error as Error).message)}
            />
          ) : loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : ordered.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">
              {search.trim()
                ? `No token matches "${search.trim()}" in this view.`
                : `No token was traded in the last ${windowLong}.`}{" "}
              {activeFilter !== "all" ? (
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setFilter("all");
                    setPage(0);
                  }}
                >
                  Show all tokens
                </button>
              ) : null}
            </p>
          ) : (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tokens">
              <Table>
                <thead>
                  <tr>
                    <Th>Token</Th>
                    <Th className="text-right">Price (XCH)</Th>
                    {WINDOWS.map((w) => (
                      <Th
                        key={w.id}
                        className={cn("text-right", w.id !== period && "hidden md:table-cell")}
                      >
                        Volume {w.label} (XCH)
                      </Th>
                    ))}
                    <Th className="hidden text-right sm:table-cell">Liquidity (XCH)</Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <TokenTableRow
                      key={row.token.assetId}
                      row={row}
                      period={period}
                      marketsLoading={markets.isLoading}
                    />
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {ordered.length > PAGE ? (
            <div className="flex items-center justify-between gap-2 text-xs text-fg-faint">
              <span>
                {formatNumber(clampedPage * PAGE + 1)}–
                {formatNumber(Math.min(ordered.length, (clampedPage + 1) * PAGE))} of{" "}
                {formatNumber(ordered.length)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={clampedPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  disabled={clampedPage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
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
