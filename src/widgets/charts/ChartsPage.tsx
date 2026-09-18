"use client";

import { useState } from "react";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { formatAmount, formatCost, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { formatBytes } from "@/shared/lib/charts/format";
import { formatDuration } from "@/shared/lib/format/time";
import { Tooltip } from "@/shared/ui/Tooltip";
import { ChartControls, type ChartControlsState } from "./ChartControls";
import { ChartCard, type ChartSpec } from "./ChartCard";
import {
  useBlocksChartSeries,
  useMempoolChartSeries,
  useNetworkChartSeries,
} from "./useChartSeries";

/**
 * Series that no provider answers today are kept here (spec, note and placement) but not
 * rendered: a page of greyed-out cards reads as broken. Flip this to preview them, or delete
 * the flag once each has a data source (backlog TASK-083).
 */
const SHOW_PLANNED_CHARTS = false;

function formatTimeForRange(range: ChartControlsState["range"]): (t: number) => string {
  if (range === "6h" || range === "24h")
    return (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (t) => new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{children}</div>
    </section>
  );
}

const NO_COINSET =
  "Coinset's indexed API has no aggregate endpoint for this (verified against its OpenAPI spec); a future provider such as nodexch could add it.";
const NO_INDEXED = (endpointNote: string) => `Not available on this endpoint: ${endpointNote}`;

export function ChartsPage() {
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

  const spec = (
    title: string,
    definition: string,
    technical: string,
    formatValue: (v: number) => string
  ): ChartSpec => ({
    title,
    definition,
    technical,
    formatValue,
    formatTime,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Charts</h1>
          <Tooltip
            text={`Series built on request from ${endpoints.isCoinset ? "Coinset" : "your configured endpoint"} — nothing is stored on our server. Series no provider can answer yet are not listed.`}
            placement="bottom"
          />
        </div>
      </header>

      <ChartControls value={controls} onChange={setControls} />

      {SHOW_PLANNED_CHARTS ? (
        <Section title="Market">
          <ChartCard
            spec={spec(
              "XCH price (USD)",
              "The XCH/USD spot price over time.",
              "Would come from Dexie's price data.",
              (v) => `$${v.toFixed(4)}`
            )}
            points={null}
            unavailable="No verified public price-history endpoint yet. The Sage wallet shows a live spot price in the header when connected; this chart needs history, which Dexie does not publish a documented endpoint for today."
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
        </Section>
      ) : null}

      <Section title="Mempool">
        <ChartCard
          spec={spec(
            "Cost used",
            "Total CLVM cost of every pending spend bundle.",
            "Sampled in this browser every time the mempool summary refreshes; kept for 2 hours.",
            (v) => formatCost(v)
          )}
          points={mempool.available ? mempool.costUsed : null}
          unavailable={
            mempool.available
              ? undefined
              : "Only the last 2 hours are sampled in this browser (Coinset has no mempool history endpoint); pick 6h or 24h to see it."
          }
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec(
            "Waiting bundles",
            "Spend bundles sitting in the mempool.",
            "Same 2-hour browser sample as Cost used.",
            (v) => formatNumber(Math.round(v))
          )}
          points={mempool.available ? mempool.waitingBundles : null}
          unavailable={
            mempool.available
              ? undefined
              : "Only the last 2 hours are sampled in this browser; pick 6h or 24h to see it."
          }
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec(
            "Total fees",
            "Fees offered by every pending spend bundle, summed.",
            "Same 2-hour browser sample as Cost used.",
            (v) => formatAmount(BigInt(Math.round(v)))
          )}
          points={mempool.available ? mempool.totalFees : null}
          unavailable={
            mempool.available
              ? undefined
              : "Only the last 2 hours are sampled in this browser; pick 6h or 24h to see it."
          }
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        {SHOW_PLANNED_CHARTS ? (
          <ChartCard
            spec={spec(
              "Median fee rate",
              "The middle fee rate among pending spend bundles.",
              "Not tracked by the browser sampler yet (it keeps totals per fee band, not the full distribution).",
              (v) => v.toFixed(3)
            )}
            points={null}
            unavailable="Not sampled yet: the mempool history keeps totals per fee band, not enough to recover a median."
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
        ) : null}
      </Section>

      <Section title="Blocks">
        <ChartCard
          spec={spec(
            "Fees per transaction block",
            "Average total fees paid in a transaction block.",
            "Averaged per sampling window from get_block_records (block_record.fees); bounded number of windows regardless of range.",
            (v) => formatAmount(BigInt(Math.max(0, Math.round(v))))
          )}
          points={blocks.series?.fees ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        {SHOW_PLANNED_CHARTS ? (
          <ChartCard
            spec={spec(
              "Cost per transaction block",
              "Average CLVM cost used in a transaction block.",
              "Not sampled at chart scale: exact cost needs a full get_block fetch per block, too heavy to sample across a range without a server-side cache. See a block's own page for its exact cost.",
              formatCost
            )}
            points={null}
            unavailable="Not sampled at chart scale — needs one full-block fetch per block. See a block's own page for its exact cost."
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
        ) : null}
        <ChartCard
          spec={spec(
            "Transaction blocks per hour",
            "How many blocks in the window carried transactions.",
            "Counted per sampling window from get_block_records.",
            (v) => v.toFixed(1)
          )}
          points={blocks.series?.txBlocksPerHour ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        {SHOW_PLANNED_CHARTS ? (
          <ChartCard
            spec={spec(
              "Spends per transaction block",
              "Average number of coins spent in a transaction block.",
              "Not sampled at chart scale: needs a per-block indexed or additions/removals fetch, too heavy to sample across a range without a server-side cache. See a block's own page for its spends.",
              (v) => v.toFixed(0)
            )}
            points={null}
            unavailable="Not sampled at chart scale — needs a per-block fetch. See a block's own page for its spends."
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
        ) : null}
        <ChartCard
          spec={spec(
            "Share of transaction blocks",
            "Transaction blocks as a share of all blocks (roughly a third).",
            "Counted per sampling window from get_block_records.",
            (v) => formatPercent(v, 1)
          )}
          points={blocks.series?.shareOfTxBlocks ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={spec(
            "Time between transaction blocks",
            "Average gap between consecutive transaction blocks.",
            "Averaged per sampling window from get_block_records timestamps.",
            (v) => formatDuration(v)
          )}
          points={blocks.series?.timeBetweenTxBlocks ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </Section>

      <Section title="Network">
        <ChartCard
          spec={spec(
            "Netspace",
            "Estimated total space farming the network.",
            "get_network_space between each sampling window's first and last block — the node's own difficulty-based estimate, not derived by us.",
            formatBytes
          )}
          points={network.netspace}
          loading={network.isLoading}
          unavailable={
            network.netspace.length === 0 && !network.isLoading
              ? NO_INDEXED("get_network_space did not answer for this endpoint.")
              : undefined
          }
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        {SHOW_PLANNED_CHARTS ? (
          <ChartCard
            spec={spec(
              "Difficulty",
              "The node's current proof-of-space difficulty target.",
              "No verified way to recover historical difficulty from get_block_records; get_blockchain_state only reports the current value.",
              (v) => formatNumber(v)
            )}
            points={null}
            unavailable="Not derivable from available endpoints without unverified math — a wrong number here would be worse than none. get_blockchain_state shows the current value on Settings."
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
        ) : null}
        <ChartCard
          spec={spec(
            "Blocks per hour",
            "All blocks (transaction and non-transaction) per hour.",
            "Counted per sampling window from get_block_records.",
            (v) => v.toFixed(1)
          )}
          points={network.blocksPerHour}
          loading={network.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </Section>

      {SHOW_PLANNED_CHARTS ? (
        <Section title="Coin set">
          <ChartCard
            spec={spec(
              "Unspent coins",
              "Total coins not yet spent.",
              "Would need a Coinset aggregate endpoint.",
              formatNumber
            )}
            points={null}
            unavailable={NO_COINSET}
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
          <ChartCard
            spec={spec(
              "Active puzzle hashes",
              "Distinct puzzle hashes holding coins.",
              "Would need a Coinset aggregate endpoint.",
              formatNumber
            )}
            points={null}
            unavailable={NO_COINSET}
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
          <ChartCard
            spec={spec(
              "Coin age",
              "Average age of unspent coins.",
              "Would need a Coinset aggregate endpoint.",
              (v) => formatDuration(v)
            )}
            points={null}
            unavailable={NO_COINSET}
            smoothing={controls.smoothing}
            scale={controls.scale}
          />
        </Section>
      ) : null}
    </div>
  );
}
