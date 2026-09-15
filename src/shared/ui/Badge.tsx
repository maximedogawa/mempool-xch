import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import type { TxSummaryKind } from "@/shared/lib/rpc/types";

type Tone = "neutral" | "primary" | "info" | "warning" | "danger" | "xch" | "cat" | "nft" | "did" | "offer" | "unknown";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-muted border-border",
  primary: "bg-primary-soft text-primary border-transparent",
  info: "bg-[color-mix(in_srgb,var(--info)_15%,transparent)] text-info border-transparent",
  warning: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  xch: "bg-[color-mix(in_srgb,var(--kind-xch)_15%,transparent)] text-kind-xch border-transparent",
  cat: "bg-[color-mix(in_srgb,var(--kind-cat)_15%,transparent)] text-kind-cat border-transparent",
  nft: "bg-[color-mix(in_srgb,var(--kind-nft)_15%,transparent)] text-kind-nft border-transparent",
  did: "bg-[color-mix(in_srgb,var(--kind-did)_15%,transparent)] text-kind-did border-transparent",
  offer: "bg-[color-mix(in_srgb,var(--kind-offer)_15%,transparent)] text-kind-offer border-transparent",
  unknown: "bg-surface-2 text-fg-faint border-border",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}

const KIND_LABELS: Record<TxKindHint, { label: string; tone: Tone }> = {
  xch: { label: "XCH", tone: "xch" },
  cat: { label: "CAT", tone: "cat" },
  nft: { label: "NFT", tone: "nft" },
  did: { label: "DID", tone: "did" },
  offer: { label: "Offer", tone: "offer" },
  singleton: { label: "Singleton", tone: "did" },
  unknown: { label: "Unknown", tone: "unknown" },
};

export function KindBadge({ kind, className }: { kind: TxKindHint; className?: string }) {
  const k = KIND_LABELS[kind];
  return (
    <Badge tone={k.tone} className={className}>
      {k.label}
    </Badge>
  );
}

const SUMMARY_KIND: Record<TxSummaryKind, { label: string; tone: Tone }> = {
  transfer: { label: "Transfer", tone: "xch" },
  swap: { label: "Swap", tone: "offer" },
  mint: { label: "Mint", tone: "nft" },
  melt: { label: "Melt", tone: "warning" },
  combine: { label: "Combine", tone: "neutral" },
  split: { label: "Split", tone: "neutral" },
  pool: { label: "Pool", tone: "info" },
  revoke: { label: "Revoke", tone: "danger" },
  clawback: { label: "Clawback", tone: "warning" },
  unknown: { label: "Unknown", tone: "unknown" },
};

export function SummaryKindBadge({ kind, className }: { kind: TxSummaryKind; className?: string }) {
  const k = SUMMARY_KIND[kind];
  return (
    <Badge tone={k.tone} className={className}>
      {k.label}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: "pending" | "confirmed" | "removed" | "unknown" }) {
  const map = {
    pending: { label: "Pending", tone: "warning" as Tone },
    confirmed: { label: "Confirmed", tone: "primary" as Tone },
    removed: { label: "Dropped", tone: "danger" as Tone },
    unknown: { label: "Unknown", tone: "neutral" as Tone },
  }[status];
  return <Badge tone={map.tone}>{map.label}</Badge>;
}
