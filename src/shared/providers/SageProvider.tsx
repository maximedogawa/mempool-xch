"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchSageNetwork, fetchSageTheme, fetchSageWalletAddress, listenSageTheme } from "@/shared/lib/sage/bridge";
import { isSageRuntime } from "@/shared/lib/sage/mappers";
import { useSettings } from "./SettingsProvider";

export interface SageContextValue {
  /** True inside the Sage wallet webview (synchronous detection, no polling). */
  inSage: boolean;
  /** Theme dictated by Sage, or null when not in Sage / not granted. */
  sageTheme: "light" | "dark" | null;
  /** Receive address of the connected wallet once wallet.get_sync_status is granted. */
  walletAddress: string | null;
}

const SageContext = createContext<SageContextValue>({ inSage: false, sageTheme: null, walletAddress: null });

/**
 * Follows the Sage host (TASK-019): network from environment.getNetwork (picker becomes
 * read-only), theme from environment.theme with live changes, my-wallet address on demand.
 * In an ordinary browser this renders children unchanged.
 */
export function SageProvider({ children }: { children: ReactNode }) {
  const { update } = useSettings();
  const [inSage, setInSage] = useState(false);
  const [sageTheme, setSageTheme] = useState<"light" | "dark" | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!isSageRuntime()) return;
    setInSage(true);
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    void (async () => {
      const [network, theme] = await Promise.all([fetchSageNetwork(), fetchSageTheme()]);
      if (cancelled) return;
      if (network) update({ network });
      if (theme) setSageTheme(theme);
      unlisten = await listenSageTheme((next) => {
        if (!cancelled) setSageTheme(next);
      });
      const address = await fetchSageWalletAddress();
      if (!cancelled) setWalletAddress(address);
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [update]);

  const value = useMemo(() => ({ inSage, sageTheme, walletAddress }), [inSage, sageTheme, walletAddress]);
  return <SageContext.Provider value={value}>{children}</SageContext.Provider>;
}

export function useSage(): SageContextValue {
  return useContext(SageContext);
}
