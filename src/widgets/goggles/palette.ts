import { feeBandFor } from "@/shared/lib/mempool/feeBands";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import type { ColourMode } from "./model";

/** Tile colour per asset kind (colour-by-kind mode and the kind chips' swatches). */
export const KIND_COLOR: Record<TxKindHint, string> = {
  xch: "var(--kind-xch)",
  cat: "var(--kind-cat)",
  nft: "var(--kind-nft)",
  did: "var(--kind-did)",
  offer: "var(--kind-offer)",
  pool: "var(--info)",
  singleton: "var(--kind-did)",
  unknown: "var(--kind-unknown)",
};

export function tileColour(mode: ColourMode, kind: TxKindHint, feeRate: number): string {
  return mode === "fee" ? `var(${feeBandFor(feeRate).cssVar})` : KIND_COLOR[kind];
}
