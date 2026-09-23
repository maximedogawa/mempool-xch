"use client";

import { PieChart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { mergeHoldings, type Holding } from "@/shared/lib/portfolio/valuation";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { useSage } from "@/shared/providers/SageProvider";
import { useT } from "@/shared/i18n/useT";
import { EmptyState } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useWatchlist } from "@/widgets/watchlist/useWatchlist";
import { PortfolioView } from "./PortfolioView";
import {
  SAGE_READ_LIMIT,
  useAddressHoldings,
  useSageHoldings,
  type SourceState,
} from "./usePortfolioData";
import portfolioNs from "@/shared/i18n/messages/en/portfolio";

function shortLabel(label: string): string {
  return label.length > 16 ? `${label.slice(0, 9)}…${label.slice(-5)}` : label;
}

function Notice({ children, tone = "muted" }: { children: string; tone?: "muted" | "warning" }) {
  return (
    <p
      className={cn(
        "rounded-sm border bg-bg px-3 py-2 text-xs",
        tone === "warning" ? "border-warning/40 text-fg-muted" : "border-border text-fg-muted"
      )}
    >
      {children}
    </p>
  );
}

/** Holdings of the Sage wallet and the watched addresses, one at a time or all together. */
export function PortfolioPage() {
  const t = useT(portfolioNs);
  const { inSage } = useSage();
  const { items } = useWatchlist();
  const addresses = useMemo(() => items.filter((i) => i.kind === "address"), [items]);
  const puzzleHashes = useMemo(() => addresses.map((a) => a.id), [addresses]);
  const sage = useSageHoldings(inSage);
  const watched = useAddressHoldings(puzzleHashes);
  const [picked, setPicked] = useState<string>("all");

  const sources = [
    ...(inSage ? [{ id: "sage", label: t("sourceSage") }] : []),
    ...addresses.map((a) => ({ id: a.id, label: shortLabel(a.label), title: a.label })),
  ];
  const source = sources.some((s) => s.id === picked) ? picked : "all";

  const selected = useMemo((): SourceState[] => {
    if (source === "sage") return [sage];
    if (source !== "all") return [watched.sources[puzzleHashes.indexOf(source)]!];
    return [...(inSage ? [sage] : []), ...watched.sources];
  }, [source, sage, watched.sources, puzzleHashes, inSage]);
  // Loading until every selected source settled; a failed one (null) does not hold the rest back.
  const holdings = useMemo((): Holding[] | null | undefined => {
    if (selected.some((s) => s.holdings === undefined)) return undefined;
    const ready = selected.flatMap((s) => (s.holdings ? [s.holdings] : []));
    if (ready.length === 0) return null;
    return ready.length === 1 ? ready[0] : mergeHoldings(ready);
  }, [selected]);

  if (sources.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Heading />
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href={routes.home()} className="text-accent hover:underline">
              {t("toDashboard")}
            </Link>
          }
        />
      </div>
    );
  }

  const usesAddresses = source !== "sage" && addresses.length > 0;
  const notice = (
    <>
      {usesAddresses && !watched.indexed ? <Notice>{t("needsIndexed")}</Notice> : null}
      {selected.some((s) => s.failed) ? <Notice tone="warning">{t("loadError")}</Notice> : null}
      {selected.some((s) => s.partial) ? (
        <Notice>{t("partial", { count: formatNumber(SAGE_READ_LIMIT) })}</Notice>
      ) : null}
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <Heading />
      {sources.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">
            {t("sources")}
          </span>
          <div role="radiogroup" aria-label={t("sources")} className="flex flex-wrap gap-1">
            {[{ id: "all", label: t("sourceAll"), title: undefined }, ...sources].map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={source === s.id}
                title={"title" in s ? s.title : undefined}
                onClick={() => setPicked(s.id)}
                className={cn(
                  "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
                  s.id !== "all" && s.id !== "sage" && "mono",
                  source === s.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-bg text-fg-muted hover:text-fg"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <PortfolioView holdings={holdings} notice={notice} />
    </div>
  );
}

function Heading() {
  const t = useT(portfolioNs);
  return (
    <header className="flex items-center gap-2">
      <PieChart size={20} className="text-primary" aria-hidden="true" />
      <h1 className="text-lg font-semibold">{t("title")}</h1>
      <Tooltip text={t("intro")} placement="bottom" />
    </header>
  );
}
