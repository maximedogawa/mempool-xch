/**
 * "What a transfer costs" table, parity with xchmempool.com/fees: the CLVM cost of
 * five common spend shapes, given (not independently re-derived here) as the values that page
 * publishes, times the current fee rate.
 */
export interface TransferCostRow {
  /** Also the row's label key under `transfers` in the fees messages. */
  id: "plain" | "threeInputs" | "cat" | "nft" | "offer";
  cost: number;
}

export const TRANSFER_COSTS: readonly TransferCostRow[] = [
  { id: "plain", cost: 11_000_000 },
  { id: "threeInputs", cost: 22_000_000 },
  { id: "cat", cost: 36_000_000 },
  { id: "nft", cost: 60_000_000 },
  { id: "offer", cost: 90_000_000 },
];

export interface TransferCostEstimate extends TransferCostRow {
  /** cost × feeRate, in mojos. */
  feeMojos: number;
}

/** Fee in mojos for each row at the given rate (mojo per cost). */
export function transferCostEstimates(feeRate: number): TransferCostEstimate[] {
  return TRANSFER_COSTS.map((row) => ({ ...row, feeMojos: row.cost * feeRate }));
}
