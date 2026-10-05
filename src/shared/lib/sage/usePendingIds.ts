"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { fetchWalletPending } from "./wallet";

/** Query key shared with the dashboard panel so the wallet is read once per interval. */
export const walletPendingKey = (network: string) => ["sage", "pending", network] as const;

/** Ids of the connected wallet's pending transactions (empty outside Sage), for "yours" marks. */
export function useWalletPendingIds(): Set<string> {
  const { inSage } = useSage();
  const { endpoints } = useSettings();
  const query = useQuery({
    queryKey: walletPendingKey(endpoints.network),
    enabled: inSage,
    queryFn: fetchWalletPending,
    refetchInterval: 10_000,
  });
  return useMemo(
    () =>
      new Set(
        (query.data ?? []).map((t) => t.id?.toLowerCase()).filter((id): id is string => !!id)
      ),
    [query.data]
  );
}
