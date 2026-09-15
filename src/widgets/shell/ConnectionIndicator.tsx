"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Tooltip } from "@/shared/ui/Tooltip";

const LABEL = { live: "Live", polling: "Polling", connecting: "Connecting", offline: "Offline" } as const;

export function ConnectionIndicator({ compact = false }: { compact?: boolean }) {
  const { status, lastEventAt } = useLive();
  const { endpoints } = useSettings();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);
  const dot = {
    live: "bg-primary shadow-[0_0_0_3px_var(--primary-soft)]",
    polling: "bg-warning",
    connecting: "bg-fg-faint animate-pulse",
    offline: "bg-danger",
  }[status];
  const text = LABEL[status];
  const age = lastEventAt ? formatAge(lastEventAt) : "no data yet";
  const hint =
    status === "live"
      ? `WebSocket stream from ${new URL(endpoints.wsUrl ?? endpoints.rpcUrl).host}. Last event ${age}.`
      : status === "polling"
        ? `Polling ${new URL(endpoints.rpcUrl).host} every few seconds. Last update ${age}.`
        : status === "connecting"
          ? "Connecting to the live stream…"
          : "No connection to the node.";
  return (
    <Tooltip text={hint}>
      <span
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center gap-1.5 rounded-sm border border-border px-2 py-1 text-xs text-fg-muted", compact && "px-1.5")}
      >
        <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden="true" />
        {!compact ? <span className="whitespace-nowrap">{text}</span> : null}
        {!compact && lastEventAt ? <span className="hidden text-fg-faint md:inline">· {age}</span> : null}
        <span className="sr-only">{`${text}, last update ${age}`}</span>
      </span>
    </Tooltip>
  );
}
