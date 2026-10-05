import type { TxSummary } from "@/shared/lib/rpc/types";

/** True when `p2` received something (XCH, a CAT or an NFT) in `tx` — the "incoming coins" check. */
export function receivesForP2(tx: TxSummary, p2: string): boolean {
  const target = p2.toLowerCase().replace(/^0x/, "");
  return tx.events.some((e) =>
    e.participants.some(
      (p) =>
        p.p2 === target &&
        (p.received.xch > 0n ||
          p.received.cats.some((c) => c.amount > 0n) ||
          p.received.nfts.length > 0)
    )
  );
}
