/** Defensive reading of Coinset's CoinSemanticMeta (keys may evolve). */
import type { TxKindHint } from "@/shared/lib/mempool/types";

export interface CoinSemantics {
  kind: TxKindHint;
  outerPuzzleType: string | null;
  custodyPuzzleType: string | null;
  custodyP2: string | null;
  assetId: string | null;
  classification: string | null;
  /** Any other keys, for the key-value list. */
  rest: [string, string][];
}

const KNOWN = new Set(["coin_id", "outer_puzzle_type", "custody_puzzle_type", "custody_p2", "asset_id", "classification", "type", "kind", "launcher_id"]);

export function kindFromSemantics(type: string | null): TxKindHint {
  const t = (type ?? "").toLowerCase();
  if (t === "xch") return "xch";
  if (t === "cat") return "cat";
  if (t === "nft") return "nft";
  if (t === "did") return "did";
  if (t.includes("singleton") || t.includes("vault") || t.includes("plot")) return "singleton";
  return "unknown";
}

export function readSemantics(raw: Record<string, unknown> | null): CoinSemantics | null {
  if (!raw) return null;
  const str = (k: string) => (typeof raw[k] === "string" && raw[k] ? (raw[k] as string).replace(/^0x/, "") : null);
  const outer = str("outer_puzzle_type") ?? str("type") ?? str("kind");
  const rest = Object.entries(raw)
    .filter(([k, v]) => !KNOWN.has(k) && v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => [k, String(v)] as [string, string]);
  return {
    kind: kindFromSemantics(outer),
    outerPuzzleType: outer,
    custodyPuzzleType: str("custody_puzzle_type"),
    custodyP2: str("custody_p2"),
    assetId: str("asset_id") ?? str("launcher_id"),
    classification: str("classification"),
    rest,
  };
}
