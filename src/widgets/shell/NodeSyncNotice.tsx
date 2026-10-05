"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useBlockchainState } from "@/shared/api/hooks";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import shellNs from "@/shared/i18n/messages/en/shell";

/**
 * Shown on every page while the node the app reads from is still catching up with the network
 * (a freshly started own node, typically): blocks, fees and the mempool it serves are behind,
 * and a syncing node keeps no mempool, so an empty one says nothing about the network.
 */
export function NodeSyncNotice() {
  const t = useT(shellNs);
  const state = useBlockchainState();
  const data = state.data;
  if (!data || data.synced) return null;
  const tip = data.syncTipHeight;
  const percent = tip ? Math.floor((data.peak.height / tip) * 1000) / 10 : null;
  return (
    <div
      role="status"
      data-testid="node-sync-notice"
      className="mb-4 flex flex-wrap items-start gap-x-3 gap-y-1 rounded-card border border-warning/40 bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface))] px-4 py-3 text-sm"
    >
      <AlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold text-fg">
          {tip
            ? t("sync.title", {
                height: formatNumber(data.peak.height),
                tip: formatNumber(tip),
                percent: percent ?? 0,
              })
            : t("sync.titleNoTip")}
        </span>
        <span className="text-fg-muted">{t("sync.body")}</span>
      </div>
      <Link
        href={routes.settings()}
        className="shrink-0 text-sm font-semibold text-primary underline"
      >
        {t("sync.settings")}
      </Link>
    </div>
  );
}
