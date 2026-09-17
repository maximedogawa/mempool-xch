import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import type { PoolSummary } from "@/shared/lib/pools/share";

/** Cycled by index across named pools; reuses existing theme tokens rather than adding new ones. */
export const POOL_PALETTE = [
  "var(--fee-1)",
  "var(--fee-3)",
  "var(--accent)",
  "var(--fee-4)",
  "var(--primary-strong)",
  "var(--fee-2)",
  "var(--fee-5)",
  "var(--fee-0)",
] as const;

export function poolColor(index: number): string {
  return POOL_PALETTE[index % POOL_PALETTE.length]!;
}

/** Decorative horizontal share bar: one segment per named pool plus one for the unidentified total. */
export function PoolShareBar({ summary }: { summary: PoolSummary }) {
  if (summary.totalBlocks === 0) return null;
  const segments = [
    ...summary.named.map((row, i) => ({
      key: row.entry.name,
      label: row.entry.name,
      share: row.share,
      color: poolColor(i),
    })),
    ...(summary.unidentified
      ? [
          {
            key: "unidentified",
            label: "Unidentified",
            share: summary.unidentified.share,
            color: "var(--border-strong)",
          },
        ]
      : []),
  ];
  const summaryText = segments.map((s) => `${formatPercent(s.share, 1)} ${s.label}`).join(", ");

  return (
    <div
      role="img"
      aria-label={`Share of the last ${formatNumber(summary.totalBlocks)} blocks by pool: ${summaryText}`}
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
    >
      {segments.map((s) =>
        s.share > 0 ? (
          <div
            key={s.key}
            style={{ width: `${s.share * 100}%`, background: s.color }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ) : null
      )}
    </div>
  );
}
