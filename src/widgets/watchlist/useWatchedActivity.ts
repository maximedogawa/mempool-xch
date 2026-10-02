"use client";

import { useQueries } from "@tanstack/react-query";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { transactionOptions } from "@/widgets/tx/useTransaction";
import { useWatchlist } from "./useWatchlist";
import { watchedAddressOptions } from "./useWatchedAddressPending";

/** Bounded address history plus pending transactions, deduplicated across watched items. */
export function useWatchedActivity() {
  const { items } = useWatchlist();
  const { client, endpoints } = useSettings();
  const addresses = items.filter((item) => item.kind === "address");
  const watchedTransactions = items.filter((item) => item.kind === "tx");
  const pending = useQueries({
    queries: addresses.map((item) => watchedAddressOptions(client, endpoints.network, item.id)),
  });
  const history = useQueries({
    queries: addresses.map((item) =>
      watchedAddressOptions(client, endpoints.network, item.id, true)
    ),
  });
  const transactions = useQueries({
    queries: watchedTransactions.map((item) =>
      transactionOptions(client, endpoints.network, item.id)
    ),
  });
  const pendingIds = new Set(watchedTransactions.map((item) => item.id));
  const confirmed = new Map<number, Set<string>>();
  const addConfirmed = (id: string, height: number | null) => {
    if (height === null) return;
    const ids = confirmed.get(height) ?? new Set<string>();
    ids.add(id);
    confirmed.set(height, ids);
  };
  for (const query of [...pending, ...history]) {
    if (query.isError) continue;
    for (const tx of query.data?.transactions ?? []) {
      if (tx.status === "pending") pendingIds.add(tx.id);
      if (tx.status === "confirmed") addConfirmed(tx.id, tx.confirmedHeight);
    }
  }
  transactions.forEach((query, index) => {
    if (query.isError || query.data?.status !== "confirmed") return;
    const item = watchedTransactions[index];
    if (item) addConfirmed(item.id, query.data.summary.confirmedHeight);
  });
  return { pendingIds, confirmed };
}
