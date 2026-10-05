"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchXchTicker, type XchTicker } from "@/shared/lib/market/xchTicker";
import { SAGE_PRICE_QUERY } from "@/shared/lib/sage/wallet";
import { useSage } from "@/shared/providers/SageProvider";

/**
 * XCH/USD with its 24-hour change from Gate.io, fresh for a minute and re-asked when a page
 * mounts or the tab regains focus (no background polling). Inside Sage the wallet's own price
 * stands in, without a change, when Gate cannot be reached.
 */
export function useXchPrice() {
  const { inSage } = useSage();
  const gate = useQuery<XchTicker>({
    queryKey: ["market", "xchTicker"],
    queryFn: ({ signal }) => fetchXchTicker(signal),
    staleTime: 60_000,
    retry: 1,
  });
  const sage = useQuery({ ...SAGE_PRICE_QUERY, enabled: inSage && gate.isError });
  const sageUsd = sage.data;
  const data = useMemo<XchTicker | null>(
    () => gate.data ?? (sageUsd ? { usd: sageUsd, change24h: null } : null),
    [gate.data, sageUsd]
  );
  return { data, isLoading: gate.isLoading };
}
