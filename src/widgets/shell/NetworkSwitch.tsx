"use client";

import { ChevronDown } from "lucide-react";
import { NETWORK_IDS, NETWORKS, type NetworkId } from "@/shared/config/networks";
import { cn } from "@/shared/lib/cn";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";

export function NetworkSwitch({ className }: { className?: string }) {
  const { settings, update } = useSettings();
  const { inSage } = useSage();
  const isTestnet = settings.network !== "mainnet";
  return (
    <label className={cn("relative inline-flex items-center", className)}>
      <span className="sr-only">Network</span>
      <select
        value={settings.network}
        onChange={(e) => update({ network: e.target.value as NetworkId })}
        disabled={inSage}
        title={inSage ? "The network follows the Sage wallet" : undefined}
        className={cn(
          "h-8 cursor-pointer appearance-none rounded-full border pl-3 pr-7 text-xs font-semibold uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isTestnet
            ? "border-warning/50 bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning"
            : "border-primary/40 bg-primary-soft text-primary"
        )}
      >
        {NETWORK_IDS.map((id) => (
          <option key={id} value={id} className="bg-bg text-fg">
            {NETWORKS[id].label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
      />
    </label>
  );
}
