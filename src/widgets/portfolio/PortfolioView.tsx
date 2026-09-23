"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useTokenList } from "@/shared/api/useTokenList";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import {
  formatChangePercent,
  formatUnits,
  formatUsd,
  formatUsdChange,
} from "@/shared/lib/portfolio/format";
import {
  allocationSlices,
  valuePortfolio,
  type Holding,
  type ValuedHolding,
} from "@/shared/lib/portfolio/valuation";
import { formatXchFigure } from "@/shared/lib/tokens/markets";
import { routes } from "@/shared/lib/routes";
import type { TokenMap } from "@/shared/api/tokenList";
import { useT } from "@/shared/i18n/useT";
import {
  AssetIcon,
  Card,
  CardBody,
  CardHeader,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { DonutChart, type DonutSlice } from "@/shared/ui/charts/DonutChart";
import { useTokenMarkets } from "@/widgets/tokens/useTokenMarkets";
import { useXchPrice } from "@/shared/api/useXchPrice";
import portfolioNs from "@/shared/i18n/messages/en/portfolio";

function nameOf(h: ValuedHolding, tokens: TokenMap | undefined, unknown: string) {
  if (h.kind === "xch") return { name: "Chia", ticker: "XCH" };
  const token = h.assetId ? tokens?.[h.assetId] : undefined;
  return {
    name: token?.name ?? h.name ?? token?.symbol ?? h.ticker ?? unknown,
    ticker: token?.symbol ?? h.ticker ?? h.assetId?.slice(0, 6) ?? "CAT",
  };
}

function ChangeChip({ ratio, usd }: { ratio: number; usd: number }) {
  const up = ratio >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        up ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger"
      )}
    >
      <Icon size={14} aria-hidden="true" />
      {formatChangePercent(ratio)} · {formatUsdChange(usd)}
    </span>
  );
}

function ShareBar({ share, color }: { share: number; color: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="tabular w-14 text-right">{formatPercent(share, 1)}</span>
      <span
        aria-hidden="true"
        className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-surface-2 sm:block"
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${Math.max(2, share * 100)}%`, background: color }}
        />
      </span>
    </div>
  );
}

/**
 * A portfolio in the manner of a portfolio tracker: headline value with its 24-hour change,
 * summary tiles, an allocation donut and the holdings table (which doubles as the chart's
 * table view). `holdings` undefined means still loading.
 */
export function PortfolioView({
  holdings,
  notice,
  compact = false,
}: {
  holdings: Holding[] | undefined;
  notice?: ReactNode;
  /** Embedded on another page: no stat tiles, the holdings table stays. */
  compact?: boolean;
}) {
  const t = useT(portfolioNs);
  const tokens = useTokenList();
  const markets = useTokenMarkets();
  const price = useXchPrice();
  const summary = useMemo(
    () => (holdings ? valuePortfolio(holdings, markets.data, price.data) : null),
    [holdings, markets.data, price.data]
  );
  const slices = useMemo(() => (summary ? allocationSlices(summary) : []), [summary]);
  const colorOf = useMemo(() => {
    const map = new Map<string, string>();
    slices.forEach((s) => {
      if (s.holding) map.set(s.key, `var(--alloc-${s.slot})`);
    });
    return (key: string) => map.get(key) ?? "var(--alloc-other)";
  }, [slices]);

  if (!summary) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const unknown = t("unknownToken");
  const pricesLoading = markets.isLoading || price.isLoading;
  const money = (xchValue: number) =>
    price.data ? formatUsd(xchValue * price.data.usd) : `${formatXchFigure(xchValue)} XCH`;
  const donut: DonutSlice[] = slices.map((s) => ({
    key: s.key,
    label: s.holding
      ? nameOf(s.holding, tokens.data, unknown).name
      : t("otherSlice", { count: s.count }),
    value: s.valueXch,
    color: s.holding ? `var(--alloc-${s.slot})` : "var(--alloc-other)",
    detail: `${money(s.valueXch)} · ${formatPercent(s.share, 1)}`,
    share: s.share,
  }));
  const xchRow = summary.rows.find((r) => r.kind === "xch");
  const priced = summary.assetCount - summary.unpricedCount;
  const largest = summary.largest ? nameOf(summary.largest, tokens.data, unknown) : null;

  return (
    <div className="flex flex-col gap-4">
      {notice}
      <Card>
        <CardBody className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-fg-muted">
            {t("total")}
            <Tooltip text={t("changeHint")} />
          </div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="tabular text-3xl font-semibold leading-tight text-fg">
              {pricesLoading && !price.data ? (
                <Skeleton className="h-9 w-40" />
              ) : summary.totalUsd !== null ? (
                formatUsd(summary.totalUsd)
              ) : (
                `${formatXchFigure(summary.totalXch)} XCH`
              )}
            </span>
            {summary.change24h !== null && summary.change24hUsd !== null ? (
              <ChangeChip ratio={summary.change24h} usd={summary.change24hUsd} />
            ) : null}
          </div>
          <span className="tabular text-sm text-fg-muted">
            {summary.totalUsd !== null
              ? t("totalXch", { value: formatXchFigure(summary.totalXch) })
              : pricesLoading
                ? null
                : t("noUsd")}
          </span>
        </CardBody>
      </Card>

      {compact ? null : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label={t("stats.assets")}
            value={formatNumber(summary.assetCount)}
            sub={t("stats.assetsSub", { priced: formatNumber(priced) })}
          />
          <StatTile
            label={t("stats.largest")}
            value={largest ? largest.name : "—"}
            sub={
              summary.largest?.share != null
                ? t("stats.largestSub", { share: formatPercent(summary.largest.share, 1) })
                : undefined
            }
          />
          <StatTile
            label={t("stats.xchShare")}
            value={xchRow?.share != null ? formatPercent(xchRow.share, 1) : "—"}
            sub={xchRow ? t("stats.xchShareSub", { value: formatUnits(xchRow.units) }) : undefined}
            tone="primary"
          />
          <StatTile
            label={t("stats.unpriced")}
            value={formatNumber(summary.unpricedCount)}
            sub={summary.unpricedCount ? t("stats.unpricedSub") : t("stats.unpricedNone")}
            tone={summary.unpricedCount ? "warning" : "default"}
          />
        </div>
      )}

      {summary.rows.length === 0 ? (
        <Card>
          <CardBody>
            <p className="py-4 text-center text-sm text-fg-faint">{t("noHoldings")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Card>
            <CardHeader title={t("allocation")} />
            <CardBody>
              {donut.length ? (
                <DonutChart
                  slices={donut}
                  ariaLabel={`${t("allocationLabel")}: ${donut
                    .map((d) => `${d.label} ${formatPercent(d.share, 1)}`)
                    .join(", ")}`}
                  center={
                    <>
                      <span className="text-xs text-fg-muted">{t("total")}</span>
                      <span className="tabular text-sm font-semibold text-fg">
                        {summary.totalUsd !== null
                          ? formatUsd(summary.totalUsd)
                          : `${formatXchFigure(summary.totalXch)} XCH`}
                      </span>
                    </>
                  }
                />
              ) : (
                <p className="py-4 text-center text-sm text-fg-faint">{t("allocationEmpty")}</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title={t("holdings")}
              action={
                <span className="text-xs text-fg-faint">
                  {t("holdingsCount", { count: formatNumber(summary.assetCount) })}
                </span>
              }
            />
            <CardBody>
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label={t("holdings")}
              >
                <Table>
                  <thead>
                    <tr>
                      <Th>{t("colAsset")}</Th>
                      <Th className="hidden text-right sm:table-cell">{t("colPrice")}</Th>
                      <Th className="text-right">{t("colAmount")}</Th>
                      <Th className="text-right">{t("colValue")}</Th>
                      <Th className="text-right">{t("colShare")}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rows.map((r) => {
                      const { name, ticker } = nameOf(r, tokens.data, unknown);
                      const href =
                        r.kind === "cat" && r.assetId ? routes.cat(r.assetId) : routes.tokens();
                      return (
                        <Tr key={r.key}>
                          <Td>
                            <Link
                              href={href}
                              className="flex min-w-0 items-center gap-2 text-fg hover:text-accent"
                            >
                              {r.kind === "xch" ? (
                                <span
                                  aria-hidden="true"
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[8px] font-bold text-primary"
                                >
                                  XCH
                                </span>
                              ) : (
                                <AssetIcon
                                  kind={r.kind}
                                  assetId={r.assetId ?? undefined}
                                  iconUrl={r.iconUrl}
                                  size={24}
                                />
                              )}
                              <span className="flex min-w-0 flex-col">
                                <span className="truncate font-medium">{name}</span>
                                <span className="text-xs text-fg-faint">{ticker}</span>
                              </span>
                            </Link>
                          </Td>
                          <Td className="tabular hidden text-right sm:table-cell">
                            {r.priceXch === null ? (
                              <span className="text-fg-faint">{t("noPrice")}</span>
                            ) : (
                              <span className="flex flex-col items-end">
                                <span>
                                  {price.data
                                    ? formatUsd(r.priceXch * price.data.usd)
                                    : `${formatXchFigure(r.priceXch)} XCH`}
                                </span>
                                {r.kind === "cat" ? (
                                  <span className="whitespace-nowrap text-xs text-fg-faint">
                                    {formatXchFigure(r.priceXch)} XCH
                                  </span>
                                ) : null}
                              </span>
                            )}
                          </Td>
                          <Td className="tabular whitespace-nowrap text-right">
                            {formatUnits(r.units)}{" "}
                            <span className="text-xs text-fg-faint">{ticker}</span>
                          </Td>
                          <Td className="tabular text-right">
                            {r.valueXch === null ? (
                              <span className="text-fg-faint">—</span>
                            ) : (
                              <span className="flex flex-col items-end">
                                <span className="font-medium">{money(r.valueXch)}</span>
                                {price.data ? (
                                  <span className="whitespace-nowrap text-xs text-fg-faint">
                                    {formatXchFigure(r.valueXch)} XCH
                                  </span>
                                ) : null}
                              </span>
                            )}
                          </Td>
                          <Td className="text-right">
                            {r.share === null ? (
                              <span className="text-fg-faint">—</span>
                            ) : (
                              <ShareBar share={r.share} color={colorOf(r.key)} />
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
