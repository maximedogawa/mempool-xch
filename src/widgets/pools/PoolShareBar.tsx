import { useT } from "@/shared/i18n/useT";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import type { PoolGroup, PoolShare } from "@/shared/lib/pools/share";
import poolsNs from "@/shared/i18n/messages/en/pools";
import type { MessageKey, Translator } from "@/shared/i18n/translate";

/** Cycled by rank across the largest groups; reuses existing theme tokens rather than adding new ones. */
const POOL_PALETTE = [
  "var(--fee-1)",
  "var(--fee-3)",
  "var(--accent)",
  "var(--fee-4)",
  "var(--fee-5)",
  "var(--fee-2)",
  "var(--fee-0)",
  "var(--primary-strong)",
] as const;

const OTHER_COLOR = "var(--border-strong)";

/** The colour of the group at `rank` in the share bar; everything past the palette is "other". */
export function poolColor(rank: number): string {
  return POOL_PALETTE[rank] ?? OTHER_COLOR;
}

type PoolsT = Translator<MessageKey<(typeof poolsNs)["messages"]>>;

export function groupLabel(group: PoolGroup, t: PoolsT): string {
  if (group.entry) return group.entry.name;
  if (group.kind === "claim") return t(group.selfPooled ? "group.selfPooled" : "group.unnamed");
  return t("group.unknown");
}

/** Decorative horizontal share bar: one segment per leading group plus one for everything else. */
export function PoolShareBar({ share }: { share: PoolShare }) {
  const t = useT(poolsNs);
  if (share.totalBlocks === 0) return null;
  const leading = share.groups.slice(0, POOL_PALETTE.length);
  const otherShare = Math.max(0, 1 - leading.reduce((sum, g) => sum + g.share, 0));
  const segments = [
    ...leading.map((group, rank) => ({
      key: group.key,
      label: group.entry
        ? group.entry.name
        : `${groupLabel(group, t)} ${shortId(group.claimTarget ?? group.payouts[0]!.payoutHash, 6, 4)}`,
      share: group.share,
      color: poolColor(rank),
    })),
    ...(share.groups.length > leading.length
      ? [{ key: "other", label: t("group.everyoneElse"), share: otherShare, color: OTHER_COLOR }]
      : []),
  ];
  const summaryText = segments.map((s) => `${formatPercent(s.share, 1)} ${s.label}`).join(", ");

  return (
    <div
      role="img"
      aria-label={t("bar.label", {
        count: formatNumber(share.totalBlocks),
        summary: summaryText,
      })}
      className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-surface-2"
    >
      {segments.map((s) =>
        s.share > 0 ? (
          <div
            key={s.key}
            title={`${s.label} · ${formatPercent(s.share, 1)}`}
            style={{ width: `${s.share * 100}%`, background: s.color }}
            className="h-full"
          />
        ) : null
      )}
    </div>
  );
}
