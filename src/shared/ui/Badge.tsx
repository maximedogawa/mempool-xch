"use client";

import type { HTMLAttributes } from "react";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import type { TxSummaryKind } from "@/shared/lib/rpc/types";
import uiNs from "@/shared/i18n/messages/en/ui";

type Tone =
  | "neutral"
  | "primary"
  | "info"
  | "warning"
  | "danger"
  | "xch"
  | "cat"
  | "nft"
  | "did"
  | "offer"
  | "unknown";

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
  offer:
    "bg-[color-mix(in_srgb,var(--kind-offer)_15%,transparent)] text-kind-offer border-transparent",
  unknown: "bg-surface-2 text-fg-faint border-border",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
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

const KIND_TONES: Record<TxKindHint, Tone> = {
  xch: "xch",
  cat: "cat",
  nft: "nft",
  did: "did",
  offer: "offer",
  pool: "info",
  singleton: "did",
  unknown: "unknown",
};

export function KindBadge({ kind, className }: { kind: TxKindHint; className?: string }) {
  const t = useT(uiNs);
  return (
    <Badge tone={KIND_TONES[kind]} className={className}>
      {t(`kind.${kind}`)}
    </Badge>
  );
}

const SUMMARY_TONES: Record<TxSummaryKind, Tone> = {
  transfer: "xch",
  swap: "offer",
  mint: "nft",
  melt: "warning",
  combine: "neutral",
  split: "neutral",
  pool: "info",
  revoke: "danger",
  clawback: "warning",
  unknown: "unknown",
};

export function SummaryKindBadge({ kind, className }: { kind: TxSummaryKind; className?: string }) {
  const t = useT(uiNs);
  return (
    <Badge tone={SUMMARY_TONES[kind]} className={className}>
      {t(`summaryKind.${kind}`)}
    </Badge>
  );
}

export function StatusBadge({
  status,
}: {
  status: "pending" | "confirmed" | "removed" | "unknown";
}) {
  const t = useT(uiNs);
  const tone = (
    {
      pending: "warning",
      confirmed: "primary",
      removed: "danger",
      unknown: "neutral",
    } as const
  )[status];
  return <Badge tone={tone}>{t(`status.${status}`)}</Badge>;
}
