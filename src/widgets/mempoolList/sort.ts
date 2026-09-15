import type { CompactMempoolItem } from "@/shared/lib/mempool/types";

export type MempoolSortKey = "feeRate" | "fee" | "cost" | "age";
export type SortDirection = "asc" | "desc";

export function sortMempoolItems(items: CompactMempoolItem[], key: MempoolSortKey, direction: SortDirection): CompactMempoolItem[] {
  const sign = direction === "desc" ? -1 : 1;
  const cmp = (a: CompactMempoolItem, b: CompactMempoolItem): number => {
    switch (key) {
      case "feeRate":
        return a.feeRate - b.feeRate;
      case "fee": {
        const d = BigInt(a.fee) - BigInt(b.fee);
        return d < 0n ? -1 : d > 0n ? 1 : 0;
      }
      case "cost":
        return a.cost - b.cost;
      case "age":
        // Older = larger age; ascending age means newest first.
        return b.firstSeen - a.firstSeen;
    }
  };
  return [...items].sort((a, b) => {
    const c = cmp(a, b) * sign;
    return c !== 0 ? c : a.id < b.id ? -1 : 1;
  });
}
