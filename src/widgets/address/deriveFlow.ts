/**
 * Derives what a transaction meant for one viewed puzzle hash (p2) from a Coinset summary:
 * net XCH change, CAT changes per asset and NFTs in/out, plus a direction label.
 */
import type { TxSummary } from "@/shared/lib/rpc/types";

export type FlowDirection = "in" | "out" | "self" | "none";

export interface AddressFlow {
  direction: FlowDirection;
  /** Net XCH change in mojos (received - sent). */
  xch: bigint;
  cats: { assetId: string; amount: bigint }[];
  nftsIn: string[];
  nftsOut: string[];
  /** Counterparty puzzle hashes (other participants). */
  counterparties: string[];
}

export function deriveAddressFlow(tx: TxSummary, p2: string): AddressFlow {
  const target = p2.toLowerCase().replace(/^0x/, "");
  let xch = 0n;
  const cats = new Map<string, bigint>();
  const nftsIn = new Set<string>();
  const nftsOut = new Set<string>();
  const counterparties = new Set<string>();
  let touched = false;

  tx.events.forEach((event) => {
    event.participants.forEach((participant) => {
      if (participant.p2 !== target) {
        counterparties.add(participant.p2);
        return;
      }
      touched = true;
      xch += participant.received.xch - participant.sent.xch;
      participant.received.cats.forEach((c) =>
        cats.set(c.assetId, (cats.get(c.assetId) ?? 0n) + c.amount)
      );
      participant.sent.cats.forEach((c) =>
        cats.set(c.assetId, (cats.get(c.assetId) ?? 0n) - c.amount)
      );
      participant.received.nfts.forEach((n) => nftsIn.add(n));
      participant.sent.nfts.forEach((n) => nftsOut.add(n));
    });
  });

  const catList = [...cats.entries()]
    .filter(([, v]) => v !== 0n)
    .map(([assetId, amount]) => ({ assetId, amount }));
  const gained = xch > 0n || catList.some((c) => c.amount > 0n) || nftsIn.size > 0;
  const lost = xch < 0n || catList.some((c) => c.amount < 0n) || nftsOut.size > 0;
  const direction: FlowDirection = !touched
    ? "none"
    : gained && !lost
      ? "in"
      : lost && !gained
        ? "out"
        : gained && lost
          ? "self"
          : "self";
  return {
    direction,
    xch,
    cats: catList,
    nftsIn: [...nftsIn],
    nftsOut: [...nftsOut],
    counterparties: [...counterparties],
  };
}
