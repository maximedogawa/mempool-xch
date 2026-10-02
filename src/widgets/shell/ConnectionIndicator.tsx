"use client";

import { Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useBlockchainState } from "@/shared/api/hooks";
import { NETWORK_IDS, NETWORKS, type NetworkId } from "@/shared/config/networks";
import { describeChannel } from "@/shared/lib/live/channel";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import shellNs from "@/shared/i18n/messages/en/shell";

type PillTone = "live" | "connecting" | "offline";

/**
 * Network and connection pill in one: the dot pulses green while updates are arriving, spins
 * while connecting and turns red when offline, and is amber on a testnet. Hovering names the
 * network and shows the connection details (channel, peak, age of the last update), clicking
 * opens the network picker. Inside Sage the network follows the wallet, so the picker is disabled.
 *
 * Polling is shown as live on purpose: the data is just as current, only its transport differs,
 * and an amber pill read as a fault whenever Coinset's socket was busy. Which channel the tab is
 * actually on stays one hover away, and in the footer and settings page.
 */
export function ConnectionIndicator({ className }: { className?: string }) {
  const t = useT(shellNs);
  const { status, transport, lastEventAt, peakHeight } = useLive();
  const { settings, update, endpoints } = useSettings();
  const { inSage } = useSage();
  const state = useBlockchainState();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);
  const age = lastEventAt ? formatAge(lastEventAt) : t("connection.noData");
  const channel = describeChannel({
    status,
    transport,
    rpcUrl: endpoints.rpcUrl,
    wsUrl: endpoints.wsUrl,
    isCoinset: endpoints.isCoinset,
    provider: endpoints.provider,
  });
  const tone: PillTone = status === "polling" ? "live" : status;
  const hint =
    status === "connecting"
      ? t("connection.connectingHint", { channel: channel.name })
      : t("connection.hint", { channel: channel.name, detail: channel.detail, age });
  const label = t(`connection.${tone}`);
  const isTestnet = settings.network !== "mainnet";
  const styles =
    tone === "offline"
      ? "border-danger/40 bg-danger-soft text-danger"
      : tone === "connecting"
        ? "border-border bg-surface text-fg-muted"
        : isTestnet
          ? "border-warning/50 bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning"
          : "border-primary/40 bg-primary-soft text-primary";
  return (
    <span className={cn("group relative inline-flex shrink-0", className)}>
      <label
        role="status"
        aria-live="polite"
        className={cn(
          "relative inline-flex h-8 w-8 items-center justify-center rounded-full border focus-within:ring-2 focus-within:ring-primary",
          inSage ? "cursor-default" : "cursor-pointer",
          styles
        )}
      >
        <span
          className="relative inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          {tone === "live" ? <span className="live-ring absolute inset-0 rounded-full" /> : null}
          {tone === "connecting" ? (
            <Loader2 size={14} className="absolute -inset-0.5 h-3.5 w-3.5 animate-spin" />
          ) : tone === "offline" ? (
            <WifiOff size={14} className="absolute -inset-0.5 h-3.5 w-3.5" />
          ) : (
            <span
              className={cn(
                "relative h-2 w-2 shrink-0 rounded-full",
                isTestnet
                  ? "bg-warning shadow-[0_0_8px_var(--warning)]"
                  : "bg-primary shadow-[0_0_8px_var(--primary)]"
              )}
            />
          )}
        </span>
        <span className="sr-only">
          {t("connection.srStatus", {
            label,
            channel: channel.name,
            peak: peak ?? t("connection.unknownPeak"),
            age,
          })}
        </span>
        <select
          value={settings.network}
          onChange={(e) => update({ network: e.target.value as NetworkId })}
          disabled={inSage}
          aria-label={t("network.label")}
          data-testid="network-switch"
          className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-default"
        >
          {NETWORK_IDS.map((id) => (
            <option key={id} value={id}>
              {NETWORKS[id].label}
            </option>
          ))}
        </select>
      </label>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-30 mt-2 hidden w-max max-w-[260px] rounded-sm border border-border-strong bg-bg-elevated px-2.5 py-1.5 text-left text-xs font-normal text-fg shadow-card group-hover:block"
      >
        <span className="block font-semibold">
          {label} · {NETWORKS[settings.network].label}
          {peak !== null ? (
            <span className="tabular ml-2 font-normal text-fg-muted">▲ {formatNumber(peak)}</span>
          ) : null}
        </span>
        <span className="block text-fg-muted">{hint}</span>
        {inSage ? <span className="block text-fg-muted">{t("network.followsSage")}</span> : null}
      </span>
    </span>
  );
}
