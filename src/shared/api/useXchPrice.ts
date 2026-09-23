"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchXchTicker, type XchTicker } from "@/shared/lib/market/xchTicker";
import { fetchXchUsdPrice } from "@/shared/lib/sage/wallet";
import { useSage } from "@/shared/providers/SageProvider";

/**
 * XCH/USD with its 24-hour change from Gate.io; inside Sage the wallet's own price stands in
 * (without a change) when Gate cannot be reached.
 */
export function useXchPrice() {
  const { inSage } = useSage();
  const gate = useQuery<XchTicker>({
    queryKey: ["market", "xchTicker"],
    queryFn: ({ signal }) => fetchXchTicker(signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const sage = useQuery({
    queryKey: ["sagePrice"],
    queryFn: fetchXchUsdPrice,
    enabled: inSage && gate.isError,
    staleTime: 60_000,
  });
  const data: XchTicker | null =
    gate.data ?? (sage.data ? { usd: sage.data, change24h: null } : null);
  return { data, isLoading: gate.isLoading };
}
