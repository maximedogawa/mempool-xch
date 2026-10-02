/** Pure helpers for the inputs → outputs flow diagram, shared by pending and confirmed views. */
import { coinName } from "@/shared/lib/chia/coin";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import type { Coin, RawCoinRef, TxSummaryEvent } from "@/shared/lib/rpc/types";

export interface FlowCoin {
  /** Coin id (hex, no prefix); empty when it cannot be derived. */
  coinId: string;
  puzzleHash: string;
  amount: bigint;
  kind: TxKindHint;
  assetId?: string;
  /** Custody puzzle hash (the "owner" address) when known; falls back to puzzleHash. */
  custodyP2?: string;
}

export interface Flow {
  inputs: FlowCoin[];
  outputs: FlowCoin[];
  totalIn: bigint;
  totalOut: bigint;
}

export function kindFromOuterPuzzleType(type: string | undefined): TxKindHint {
  const t = (type ?? "").toLowerCase();
  if (t === "cat") return "cat";
  if (t === "nft") return "nft";
  if (t === "did") return "did";
  if (t === "xch" || t === "") return t === "" ? "unknown" : "xch";
  if (t.includes("singleton") || t.includes("vault") || t.includes("plot")) return "singleton";
  return "unknown";
}

export function flowFromCoins(
  removals: Coin[],
  additions: Coin[],
  kind: TxKindHint,
  assetIds: string[]
): Flow {
  const toFlow = (coin: Coin): FlowCoin => ({
    coinId: coinName(coin),
    puzzleHash: coin.puzzleHash,
    amount: coin.amount,
    kind: kind === "unknown" ? "xch" : kind,
    assetId: kind === "cat" && assetIds.length === 1 ? assetIds[0] : undefined,
  });
  const inputs = removals.map(toFlow);
  const outputs = additions.map(toFlow);
  return { inputs, outputs, totalIn: sum(inputs), totalOut: sum(outputs) };
}

export function flowFromEvents(events: TxSummaryEvent[]): Flow {
  const seen = new Set<string>();
  const toFlow = (ref: RawCoinRef): FlowCoin => ({
    coinId: ref.coinId,
    puzzleHash: ref.puzzleHash,
    amount: ref.amount,
    kind: kindFromOuterPuzzleType(ref.outerPuzzleType),
    assetId: ref.assetId,
    custodyP2: ref.custodyP2,
  });
  const dedupe = (refs: RawCoinRef[]) =>
    refs.filter((r) => (seen.has(r.coinId) ? false : (seen.add(r.coinId), true))).map(toFlow);
  const inputs = dedupe(events.flatMap((e) => e.inputs));
  seen.clear();
  const outputs = dedupe(events.flatMap((e) => e.outputs));
  return { inputs, outputs, totalIn: sum(inputs), totalOut: sum(outputs) };
}

function sum(coins: FlowCoin[]): bigint {
  return coins.filter((c) => c.kind === "xch").reduce((s, c) => s + c.amount, 0n);
}

/** Memos as hex strings, deduplicated, from every event. */
export function collectMemos(events: TxSummaryEvent[]): string[] {
  return [...new Set(events.flatMap((e) => e.memos).filter((m) => m.length > 0))];
}
