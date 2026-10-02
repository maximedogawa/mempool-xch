"use client";

import { useMemo, useState } from "react";
import { useTokenList } from "@/shared/api/useTokenList";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
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
import { formatUsd, formatUsdCompact } from "@/shared/lib/portfolio/format";
import { formatXchFigure, spreadRatio, type VolumeWindow } from "@/shared/lib/tokens/markets";
import { useXchPrice } from "@/shared/api/useXchPrice";
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
import { useT } from "@/shared/i18n/useT";
import { useTokenMarkets } from "./useTokenMarkets";
import tokensNs from "@/shared/i18n/messages/en/tokens";

const PAGE = 25;

const WINDOWS: readonly VolumeWindow[] = ["d1", "d7", "d30"];
const FILTERS: readonly TokenFilter[] = ["traded", "liquid", "priced", "all"];
const SORTS: readonly TokenSort[] = ["volume", "liquidity", "price", "name"];

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

function Figure({
  value,
  loading,
  usd,
  compact = false,
}: {
  value: number | null;
  loading: boolean;
  /** XCH/USD: adds the dollar figure under the XCH one. */
  usd?: number | null;
  compact?: boolean;
}) {
  if (loading) return <Skeleton className="ml-auto h-4 w-14" />;
  if (value === null || value === 0) return <span className="text-fg-faint">—</span>;
  return (
    <span className="flex flex-col items-end">
      <span>{formatXchFigure(value)}</span>
      {usd ? (
        <span className="text-xs text-fg-faint">
          {compact ? formatUsdCompact(value * usd) : formatUsd(value * usd)}
        </span>
      ) : null}
    </span>
  );
}

function TokenTableRow({
  row,
  period,
  marketsLoading,
  usd,
}: {
  row: TokenRow;
  period: VolumeWindow;
  marketsLoading: boolean;
  usd: number | null;
}) {
  const { token, market } = row;
  const spread = market ? spreadRatio(market) : null;
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
        <Figure value={market?.lastPriceXch ?? null} loading={marketsLoading} usd={usd} />
      </Td>
      {WINDOWS.map((w) => (
        <Td
          key={w}
          className={cn(
            "tabular text-right",
            w === period ? "font-medium text-fg" : "hidden text-fg-muted md:table-cell"
          )}
        >
          <Figure
            value={market?.volumeXch[w] ?? null}
            loading={marketsLoading}
            usd={w === period ? usd : null}
            compact
          />
        </Td>
      ))}
      <Td className="tabular hidden text-right sm:table-cell">
        <Figure value={row.liquidityXch} loading={false} usd={usd} compact />
      </Td>
      <Td className="tabular hidden text-right text-fg-muted lg:table-cell">
        {marketsLoading ? (
          <Skeleton className="ml-auto h-4 w-20" />
        ) : market?.low30dXch && market.high30dXch ? (
          `${formatXchFigure(market.low30dXch)}–${formatXchFigure(market.high30dXch)}`
        ) : (
          <span className="text-fg-faint">—</span>
        )}
      </Td>
      <Td className="tabular hidden text-right text-fg-muted lg:table-cell">
        {marketsLoading ? (
          <Skeleton className="ml-auto h-4 w-10" />
        ) : spread !== null ? (
          formatPercent(spread, 1)
        ) : (
          <span className="text-fg-faint">—</span>
        )}
      </Td>
    </Tr>
  );
}

export function TokensPage() {
  const t = useT(tokensNs);
  const tokens = useTokenList();
  const markets = useTokenMarkets();
  const xchPrice = useXchPrice();
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
  const loading = tokens.isLoading || (markets.isLoading && filter !== "all");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <Tooltip text={t("intro", { total: formatNumber(rows.length) })} placement="bottom" />
        </div>
      </header>

      <Card>
        <CardHeader
          title={t("title")}
          action={
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              className="h-8 w-48 rounded-sm border border-border bg-surface px-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none sm:w-64"
            />
          }
        />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Choice
              label={t("show")}
              value={activeFilter}
              options={FILTERS.map((f) => ({
                id: f,
                label:
                  f === "traded"
                    ? t("filters.tradedIn", { window: t(`windows.${period}`) })
                    : t(`filters.${f}`),
                count: markets.data || f === "all" || f === "liquid" ? counts[f] : undefined,
              }))}
              onChange={(id) => {
                setFilter(id);
                setPage(0);
              }}
            />
            <Choice
              label={t("period")}
              value={period}
              options={WINDOWS.map((w) => ({ id: w, label: t(`windows.${w}`) }))}
              onChange={(id) => {
                setPeriod(id);
                setPage(0);
              }}
            />
            <Choice
              label={t("sort")}
              value={sort}
              options={SORTS.map((o) => ({ id: o, label: t(`sorts.${o}`) }))}
              onChange={(id) => {
                setSort(id);
                setPage(0);
              }}
            />
          </div>

          {markets.error ? (
            <p className="rounded-sm border border-border bg-bg p-3 text-sm text-fg-muted">
              {t("marketsError")}{" "}
              <button
                type="button"
                className="font-medium text-accent hover:underline"
                onClick={() => void markets.refetch()}
              >
                {t("tryAgain")}
              </button>
            </p>
          ) : null}

          {tokens.error ? (
            <EmptyState
              tone="danger"
              title={t("registryError")}
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
              {search.trim() ? t("noMatch", { query: search.trim() }) : t(`noTraded.${period}`)}{" "}
              {activeFilter !== "all" ? (
                <button
                  type="button"
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    setFilter("all");
                    setPage(0);
                  }}
                >
                  {t("showAll")}
                </button>
              ) : null}
            </p>
          ) : (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("title")}>
              <Table>
                <thead>
                  <tr>
                    <Th>{t("colToken")}</Th>
                    <Th className="text-right">{t("colPrice")}</Th>
                    {WINDOWS.map((w) => (
                      <Th
                        key={w}
                        className={cn("text-right", w !== period && "hidden md:table-cell")}
                      >
                        {t("colVolume", { window: t(`windows.${w}`) })}
                      </Th>
                    ))}
                    <Th className="hidden text-right sm:table-cell">{t("colLiquidity")}</Th>
                    <Th className="hidden text-right lg:table-cell">{t("colRange")}</Th>
                    <Th className="hidden text-right lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        {t("colSpread")}
                        <Tooltip text={t("spreadHint")} />
                      </span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <TokenTableRow
                      key={row.token.assetId}
                      row={row}
                      period={period}
                      marketsLoading={markets.isLoading}
                      usd={xchPrice.data?.usd ?? null}
                    />
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {ordered.length > PAGE ? (
            <div className="flex items-center justify-between gap-2 text-xs text-fg-faint">
              <span>
                {t("range", {
                  from: formatNumber(clampedPage * PAGE + 1),
                  to: formatNumber(Math.min(ordered.length, (clampedPage + 1) * PAGE)),
                  total: formatNumber(ordered.length),
                })}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={clampedPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  {t("previous")}
                </Button>
                <Button
                  size="sm"
                  disabled={clampedPage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  {t("next")}
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
