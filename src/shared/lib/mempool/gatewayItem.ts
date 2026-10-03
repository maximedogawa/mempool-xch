/**
 * A mempool transaction as a nodexch gateway gives it (nodexch TASK-147): in the `added` list
 * of a `mempool_delta` frame and in `GET /x/node/v1/mempool/items`. The gateway reads the
 * details from the item it fetches anyway, with this app's own rules (./classify.ts), so the
 * app does not fetch an item (megabytes of puzzle reveals) per pending transaction.
 */
import { feePerCost } from "@/shared/lib/chia/amounts";
import type { CompactCoin, CompactMempoolItem, TxKindHint } from "./types";

const KINDS: readonly TxKindHint[] = [
  "xch",
  "cat",
  "nft",
  "did",
  "offer",
  "pool",
  "singleton",
  "unknown",
];

type Raw = Record<string, unknown>;

const hex = (v: unknown) =>
  String(v ?? "")
    .replace(/^0x/, "")
    .toLowerCase();
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
/** Mojos as decimal digits, whether they came as a number, a bigint or a string. */
const digits = (v: unknown) => {
  const text = typeof v === "bigint" || typeof v === "number" ? v.toString() : String(v ?? "");
  return /^\d+$/.test(text) ? text : "0";
};

function coin(raw: unknown): CompactCoin {
  const c = (raw ?? {}) as Raw;
  return { ph: hex(c.puzzle_hash), amount: digits(c.amount), parent: hex(c.parent_coin_info) };
}

/**
 * The compact item of one gateway entry; null when the entry carries no details (a gateway
 * from before TASK-147, or an item its budget left unfetched), which the caller must then get
 * another way.
 */
export function compactFromGateway(raw: unknown): CompactMempoolItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Raw;
  const kind = KINDS.find((k) => k === r.kind);
  const assets = r.assets as Raw | null | undefined;
  if (typeof r.id !== "string" || !kind || !assets || typeof assets !== "object") return null;
  const fee = digits(r.fee_mojos);
  const cost = count(r.cost);
  return {
    id: hex(r.id),
    fee,
    cost,
    feeRate: feePerCost(BigInt(fee), cost),
    spends: count(r.spends),
    additions: list(r.additions).map(coin),
    removals: list(r.removals).map(coin),
    additionCount: count(r.addition_count),
    removalCount: count(r.removal_count),
    assets: {
      xch: digits(assets.xch),
      cats: list(assets.cats).map((cat) => {
        const c = (cat ?? {}) as Raw;
        return { assetId: c.asset_id ? hex(c.asset_id) : "unknown", amount: digits(c.amount) };
      }),
      nfts: count(assets.nfts),
      dids: count(assets.dids),
      singletons: count(assets.singletons),
    },
    firstSeen: count(r.first_seen_ms),
    kind,
    assetIds: list(r.asset_ids).map(hex),
  };
}

/** Every entry of a list, or null as soon as one has no details. */
export function compactAllFromGateway(raw: unknown): CompactMempoolItem[] | null {
  const items: CompactMempoolItem[] = [];
  for (const entry of list(raw)) {
    const item = compactFromGateway(entry);
    if (!item) return null;
    items.push(item);
  }
  return items;
}
