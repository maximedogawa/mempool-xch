"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NETWORK_IDS, NETWORKS, type NetworkId } from "@/shared/config/networks";
import { cn } from "@/shared/lib/cn";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";

export function NetworkSwitch({ className }: { className?: string }) {
  const { settings, update } = useSettings();
  const { inSage } = useSage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isTestnet = settings.network !== "mainnet";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (id: NetworkId) => {
    update({ network: id });
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={inSage}
        title={inSage ? "The network follows the Sage wallet" : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-8 cursor-pointer items-center gap-1 rounded-full border pl-3 pr-2 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-70",
          isTestnet ? "border-warning/50 bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning" : "border-primary/40 bg-primary-soft text-primary"
        )}
      >
        {NETWORKS[settings.network].label}
        <ChevronDown size={12} aria-hidden="true" className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <ul role="listbox" aria-label="Network" className="absolute right-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-sm border border-border-strong bg-bg-elevated py-1 text-sm normal-case tracking-normal shadow-card">
          {NETWORK_IDS.map((id) => {
            const selected = settings.network === id;
            const warn = id !== "mainnet";
            return (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => select(id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium hover:bg-surface-2",
                    selected ? (warn ? "text-warning" : "text-primary") : "text-fg-muted"
                  )}
                >
                  {NETWORKS[id].label}
                  {selected ? <Check size={14} aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
