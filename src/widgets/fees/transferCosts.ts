/**
 * "What a transfer costs" table (TASK-059), parity with xchmempool.com/fees: the CLVM cost of
 * five common spend shapes, given (not independently re-derived here) as the values that page
 * publishes, times the current fee rate.
 */
export interface TransferCostRow {
  id: string;
  label: string;
  cost: number;
}

export const TRANSFER_COSTS: readonly TransferCostRow[] = [
  { id: "plain", label: "Plain transfer", cost: 11_000_000 },
  { id: "three-input", label: "Transfer with 3 inputs", cost: 22_000_000 },
  { id: "cat", label: "Send a CAT", cost: 36_000_000 },
  { id: "nft", label: "Transfer an NFT", cost: 60_000_000 },
  { id: "offer", label: "Accept an offer", cost: 90_000_000 },
];

export interface TransferCostEstimate extends TransferCostRow {
  /** cost × feeRate, in mojos. */
  feeMojos: number;
}

/** Fee in mojos for each row at the given rate (mojo per cost). */
export function transferCostEstimates(feeRate: number): TransferCostEstimate[] {
  return TRANSFER_COSTS.map((row) => ({ ...row, feeMojos: row.cost * feeRate }));
}
