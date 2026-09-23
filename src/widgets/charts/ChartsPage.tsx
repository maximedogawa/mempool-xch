"use client";

import { useState } from "react";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  formatAmount,
  formatCost,
  formatFeeRate,
  formatNumber,
  formatPercent,
} from "@/shared/lib/chia/amounts";
import { formatBytes } from "@/shared/lib/charts/format";
import { formatDuration } from "@/shared/lib/format/time";
import { intlTag } from "@/shared/i18n/active";
import { formatFixed } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import { Tooltip } from "@/shared/ui/Tooltip";
import { ChartControls, type ChartControlsState } from "./ChartControls";
import { ChartCard, type ChartSpec } from "./ChartCard";
import {
  useBlocksChartSeries,
  useMempoolChartSeries,
  useNetworkChartSeries,
  usePriceHistory,
  useTxBlockSampleSeries,
} from "./useChartSeries";

/**
 * Only series with a real data source are listed: a page of greyed-out "not available" cards
 * reads as broken. Coin-set aggregates (unspent coins, active puzzle hashes, coin age) were
 * dropped for that reason: no public endpoint answers them.
 */

function formatTimeForRange(range: ChartControlsState["range"]): (t: number) => string {
  if (range === "6h" || range === "24h")
    return (t) =>
      new Date(t).toLocaleTimeString(intlTag(), {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
  return (t) => new Date(t).toLocaleDateString(intlTag(), { day: "2-digit", month: "short" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
    </section>
  );
}

type ChartId =
  | "price"
  | "costUsed"
  | "waitingBundles"
  | "totalFees"
  | "medianFeeRate"
  | "feesPerTxBlock"
  | "costPerTxBlock"
  | "txBlocksPerHour"
  | "spendsPerTxBlock"
  | "shareOfTxBlocks"
  | "timeBetweenTxBlocks"
  | "netspace"
  | "difficulty"
  | "blocksPerHour";

export function ChartsPage() {
  const t = useT("charts");
  const { endpoints } = useSettings();
  const [controls, setControls] = useState<ChartControlsState>({
    range: "24h",
    smoothing: "smooth",
    scale: "linear",
  });
  const formatTime = formatTimeForRange(controls.range);

  const blocks = useBlocksChartSeries(controls.range);
  const network = useNetworkChartSeries(controls.range);
  const mempool = useMempoolChartSeries(controls.range);
  const sampledBlocks = useTxBlockSampleSeries(controls.range);
  const price = usePriceHistory(controls.range);

  const spec = (id: ChartId, technical: string, formatValue: (v: number) => string): ChartSpec => ({
    title: t(`${id}.title`),
    definition: t(`${id}.definition`),
    technical,
    formatValue,
    formatTime,
  });
  const perWindow = t("notes.perWindow");
  const sameSample = t("notes.sameSample");
  const sampledOnly = t("notes.sampledOnly");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <Tooltip
            text={endpoints.isCoinset ? t("tooltipCoinset") : t("tooltipCustom")}
            placement="bottom"
          />
        </div>
      </header>

      <ChartControls value={controls} onChange={setControls} />

      <Section title={t("sections.market")}>
        <ChartCard
          spec={spec("price", t("price.technical"), (v) => `${formatFixed(v, 3)} USDT`)}
          points={price.data ?? null}
          loading={price.isLoading}
          unavailable={price.isError ? t("price.unavailable") : undefined}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </Section>

      <Section title={t("sections.mempool")}>
        <ChartCard
          spec={spec("costUsed", t("costUsed.technical"), (v) => formatCost(v))}
          points={mempool.available ? mempool.costUsed : null}
          unavailable={mempool.available ? undefined : t("costUsed.unavailable")}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("waitingBundles", sameSample, (v) => formatNumber(Math.round(v)))}
          points={mempool.available ? mempool.waitingBundles : null}
          unavailable={mempool.available ? undefined : sampledOnly}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("totalFees", sameSample, (v) => formatAmount(BigInt(Math.round(v))))}
          points={mempool.available ? mempool.totalFees : null}
          unavailable={mempool.available ? undefined : sampledOnly}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("medianFeeRate", t("medianFeeRate.technical"), (v) => formatFeeRate(v))}
          points={mempool.available ? mempool.medianFeeRate : null}
          unavailable={mempool.available ? undefined : sampledOnly}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </Section>

      <Section title={t("sections.blocks")}>
        <ChartCard
          spec={spec("feesPerTxBlock", t("feesPerTxBlock.technical"), (v) =>
            formatAmount(BigInt(Math.max(0, Math.round(v))))
          )}
          points={blocks.series?.fees ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("costPerTxBlock", t("costPerTxBlock.technical"), formatCost)}
          points={sampledBlocks.cost}
          loading={sampledBlocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("txBlocksPerHour", perWindow, (v) => formatFixed(v, 1))}
          points={blocks.series?.txBlocksPerHour ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("spendsPerTxBlock", t("spendsPerTxBlock.technical"), (v) =>
            formatNumber(Math.round(v))
          )}
          points={sampledBlocks.spends}
          loading={sampledBlocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("shareOfTxBlocks", perWindow, (v) => formatPercent(v, 1))}
          points={blocks.series?.shareOfTxBlocks ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("timeBetweenTxBlocks", t("timeBetweenTxBlocks.technical"), (v) =>
            formatDuration(v)
          )}
          points={blocks.series?.timeBetweenTxBlocks ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </Section>

      <Section title={t("sections.network")}>
        <ChartCard
          spec={spec("netspace", t("netspace.technical"), formatBytes)}
          points={network.netspace}
          loading={network.isLoading}
          unavailable={
            network.netspace.length === 0 && !network.isLoading ? t("notes.noNetspace") : undefined
          }
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("difficulty", t("difficulty.technical"), (v) => formatNumber(Math.round(v)))}
          points={network.difficulty}
          loading={network.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec("blocksPerHour", perWindow, (v) => formatFixed(v, 1))}
          points={network.blocksPerHour}
          loading={network.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </Section>
    </div>
  );
}
