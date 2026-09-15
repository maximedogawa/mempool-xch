"use client";

import { Loader2, Radar, WifiOff, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useBlockchainState } from "@/shared/api/hooks";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Tooltip } from "@/shared/ui/Tooltip";

const LABEL = { live: "Live", polling: "Polling", connecting: "Connecting", offline: "Offline" } as const;

/**
 * Connection pill: a pulsing green ring while the WebSocket stream is live, a sweeping radar
 * while polling, a spinner while connecting, red when offline. Shows the peak height and the
 * age of the last update so "alive" is visible at a glance.
 */
export function ConnectionIndicator({ compact = false }: { compact?: boolean }) {
  const { status, lastEventAt, peakHeight } = useLive();
  const { endpoints } = useSettings();
  const state = useBlockchainState();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);
  const age = lastEventAt ? formatAge(lastEventAt) : "no data yet";
  const host = new URL(status === "live" && endpoints.wsUrl ? endpoints.wsUrl : endpoints.rpcUrl).host;
  const hint =
    status === "live"
      ? `Streaming peak and transaction events from ${host}. Last event ${age}.`
      : status === "polling"
        ? `Polling ${host} every few seconds. Last update ${age}.`
        : status === "connecting"
          ? "Connecting to the live stream…"
          : "No connection to the node.";
  const styles = {
    live: "border-primary/40 bg-primary-soft text-primary",
    polling: "border-warning/40 bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning",
    connecting: "border-border bg-surface text-fg-muted",
    offline: "border-danger/40 bg-danger-soft text-danger",
  }[status];
  return (
    <Tooltip text={hint}>
      <span
        role="status"
        aria-live="polite"
        className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-xs font-semibold", styles, compact && "px-2")}
      >
        <span className="relative inline-flex h-2.5 w-2.5 items-center justify-center" aria-hidden="true">
          {status === "live" ? <span className="live-ring absolute inset-0 rounded-full" /> : null}
          {status === "polling" ? (
            <Radar size={14} className="animate-radar absolute -inset-0.5 h-3.5 w-3.5" />
          ) : status === "connecting" ? (
            <Loader2 size={14} className="absolute -inset-0.5 h-3.5 w-3.5 animate-spin" />
          ) : status === "offline" ? (
            <WifiOff size={14} className="absolute -inset-0.5 h-3.5 w-3.5" />
          ) : (
            <span className="relative h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          )}
        </span>
        {!compact ? <span className="whitespace-nowrap">{LABEL[status]}</span> : null}
        {!compact && status === "live" ? <Zap size={12} aria-hidden="true" className="-ml-1 hidden md:inline" /> : null}
        {!compact && peak !== null ? (
          <span className="tabular hidden items-center gap-1 border-l border-current/30 pl-2 font-medium text-fg md:inline-flex">
            <span className="text-fg-faint">▲</span> {formatNumber(peak)}
          </span>
        ) : null}
        {!compact && lastEventAt ? <span className="hidden font-normal text-fg-faint lg:inline">{age}</span> : null}
        <span className="sr-only">{`${LABEL[status]}, peak ${peak ?? "unknown"}, last update ${age}`}</span>
      </span>
    </Tooltip>
  );
}
