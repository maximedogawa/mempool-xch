"use client";

/**
 * Wallet data straight from the Sage host (only inside Sage). Sage is a light wallet, not a
 * full node: it knows your addresses, balances, coins and transactions, but not the mempool or
 * other people's blocks, so chain-wide data keeps coming from the configured RPC endpoint.
 */
import { capabilities, getSage } from "./bridge";

export const WALLET_CAPABILITIES = ["wallet.get_sync_status", "wallet.get_pending_transactions", "wallet.get_transactions", "wallet.get_coins", "wallet.get_coins_by_ids", "wallet.check_address", "wallet.get_xch_usd_price"] as const;

export interface WalletCoinRef {
  coinId: string;
  amount: bigint;
  address: string | null;
  assetKind: string;
  assetId: string | null;
  assetName: string | null;
  ticker: string | null;
  precision: number;
  /** Icon Sage resolved for the asset, if any. */
  iconUrl: string | null;
}

export interface WalletTx {
  id: string | null;
  height: number | null;
  timestamp: number | null;
  fee: bigint | null;
  spent: WalletCoinRef[];
  created: WalletCoinRef[];
  pending: boolean;
}

export interface WalletCoin {
  coinId: string;
  address: string;
  amount: bigint;
  createdHeight: number | null;
  spentHeight: number | null;
}

export interface WalletOverview {
  receiveAddress: string | null;
  balance: bigint;
  ticker: string;
  precision: number;
  syncedCoins: number;
  totalCoins: number;
  pending: WalletTx[];
  recent: WalletTx[];
  totalTransactions: number;
  coins: WalletCoin[];
  totalCoinCount: number;
  granted: string[];
}

type Raw = Record<string, unknown>;
const asRaw = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const big = (v: unknown): bigint => {
  try {
    return typeof v === "bigint" ? v : BigInt(String(v ?? "0").split(".")[0] || "0");
  } catch {
    return 0n;
  }
};
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

function coinRef(raw: unknown): WalletCoinRef {
  const r = asRaw(raw);
  const asset = asRaw(r.asset);
  return {
    coinId: String(r.coin_id ?? "").replace(/^0x/, ""),
    amount: big(r.amount),
    address: str(r.address),
    assetKind: String(asset.kind ?? asset.asset_kind ?? "unknown"),
    assetId: str(asset.asset_id)?.replace(/^0x/, "") ?? null,
    assetName: str(asset.name),
    ticker: str(asset.ticker),
    precision: num(asset.precision) ?? 12,
    iconUrl: (() => {
      const u = str(asset.icon_url);
      return u && /^https:\/\//.test(u) ? u : null;
    })(),
  };
}

/** Capabilities the overview needs; each is requested at most once per session. */
const OVERVIEW_CAPABILITIES = ["wallet.get_sync_status", "wallet.get_pending_transactions"] as const;

async function ensureAll(caps: readonly string[]): Promise<string[]> {
  const results = await Promise.all(caps.map(async (c) => ((await capabilities.ensure(c)) ? c : null)));
  return results.filter((c): c is string => c !== null);
}

export async function fetchWalletOverview(): Promise<WalletOverview | null> {
  const client = await getSage();
  if (!client) return null;
  await ensureAll(OVERVIEW_CAPABILITIES);
  const has = (c: string) => capabilities.has(c);
  const status = has("wallet.get_sync_status") ? await client.wallet.getSyncStatus().catch(() => null) : null;
  const pendingRes = has("wallet.get_pending_transactions") ? await client.wallet.getPendingTransactions().catch(() => null) : null;
  const txRes = null;
  const coinsRes = null;
  const s = asRaw(status);
  const unit = asRaw(s.unit);
  return {
    receiveAddress: str(s.receive_address),
    balance: big(s.selectable_balance),
    ticker: str(unit.ticker) ?? "XCH",
    precision: num(unit.precision) ?? 12,
    syncedCoins: num(s.synced_coins) ?? 0,
    totalCoins: num(s.total_coins) ?? 0,
    pending: (asRaw(pendingRes).transactions as unknown[] | undefined ?? []).map((t) => {
      const r = asRaw(t);
      return { id: str(r.transaction_id)?.replace(/^0x/, "") ?? null, height: null, timestamp: num(r.submitted_at), fee: big(r.fee), spent: (r.spent as unknown[] | undefined ?? []).map(coinRef), created: (r.created as unknown[] | undefined ?? []).map(coinRef), pending: true };
    }),
    recent: (asRaw(txRes).transactions as unknown[] | undefined ?? []).map((t) => {
      const r = asRaw(t);
      return { id: null, height: num(r.height), timestamp: num(r.timestamp), fee: null, spent: (r.spent as unknown[] | undefined ?? []).map(coinRef), created: (r.created as unknown[] | undefined ?? []).map(coinRef), pending: false };
    }),
    totalTransactions: num(asRaw(txRes).total) ?? 0,
    coins: (asRaw(coinsRes).coins as unknown[] | undefined ?? []).map((c) => {
      const r = asRaw(c);
      return { coinId: String(r.coin_id ?? "").replace(/^0x/, ""), address: str(r.address) ?? "", amount: big(r.amount), createdHeight: num(r.created_height), spentHeight: num(r.spent_height) };
    }),
    totalCoinCount: num(asRaw(coinsRes).total) ?? 0,
    granted: capabilities.snapshot().granted,
  };
}

/* ---- Sage-first helpers used by the explorer pages inside Sage ---- */

/** True when the wallet owns this address (wallet.check_address). Null when not in Sage / not granted. */
export async function checkWalletAddress(address: string): Promise<boolean | null> {
  const client = await getSage();
  if (!client || !(await capabilities.ensure("wallet.check_address"))) return null;
  try {
    const result = await client.wallet.checkAddress({ address });
    return Boolean((result as { valid?: boolean }).valid);
  } catch {
    return null;
  }
}

/** The wallet's own record of a coin, or null when the coin is not in the wallet. */
export async function fetchWalletCoin(coinId: string): Promise<WalletCoin | null> {
  const client = await getSage();
  if (!client || !(await capabilities.ensure("wallet.get_coins_by_ids"))) return null;
  try {
    const result = await client.wallet.getCoinsByIds({ coin_ids: [`0x${coinId.replace(/^0x/, "")}`] });
    const raw = asRaw((asRaw(result).coins as unknown[] | undefined ?? [])[0]);
    if (!raw.coin_id) return null;
    return { coinId: String(raw.coin_id).replace(/^0x/, ""), address: str(raw.address) ?? "", amount: big(raw.amount), createdHeight: num(raw.created_height), spentHeight: num(raw.spent_height) };
  } catch {
    return null;
  }
}

/** XCH/USD from the wallet's own price feed (wallet.get_xch_usd_price). */
export async function fetchXchUsdPrice(): Promise<number | null> {
  const client = await getSage();
  // Never requests the grant here: the header chip only appears once the user enabled it.
  if (!client || !capabilities.has("wallet.get_xch_usd_price")) return null;
  try {
    const result = await client.wallet.getXchUsdPrice();
    const usd = (result as { usd?: unknown }).usd;
    return typeof usd === "number" && Number.isFinite(usd) ? usd : null;
  } catch {
    return null;
  }
}

/**
 * Ask Sage to whitelist a custom chain endpoint so the app may call it from inside the
 * wallet (Sage only whitelists https and wss hosts). Returns granted / refused / not-in-sage.
 */
export async function requestEndpointWhitelist(url: string, networkId: string): Promise<"granted" | "refused" | "unsupported" | "not-in-sage"> {
  const client = await getSage();
  if (!client) return "not-in-sage";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "unsupported";
  }
  if (parsed.protocol !== "https:") return "unsupported";
  try {
    const result = await client.app.requestNetworkWhitelistGrant({ entry: { scheme: "https", host: parsed.host }, networkId });
    return (result as { granted?: boolean }).granted ? "granted" : "refused";
  } catch {
    return "refused";
  }
}

/* ---- Paged history (TASK-032) ---- */

export interface WalletTxPage {
  items: WalletTx[];
  total: number;
  offset: number;
}

export interface WalletCoinPage {
  items: WalletCoin[];
  total: number;
  offset: number;
}

function toWalletTx(raw: unknown): WalletTx {
  const r = asRaw(raw);
  return {
    id: str(r.transaction_id)?.replace(/^0x/, "") ?? null,
    height: num(r.height),
    timestamp: num(r.timestamp),
    fee: r.fee === undefined ? null : big(r.fee),
    spent: (r.spent as unknown[] | undefined ?? []).map(coinRef),
    created: (r.created as unknown[] | undefined ?? []).map(coinRef),
    pending: false,
  };
}

function toWalletCoin(raw: unknown): WalletCoin {
  const r = asRaw(raw);
  return { coinId: String(r.coin_id ?? "").replace(/^0x/, ""), address: str(r.address) ?? "", amount: big(r.amount), createdHeight: num(r.created_height), spentHeight: num(r.spent_height) };
}

/** One page of the wallet's confirmed transactions, newest first. */
export async function fetchWalletTransactionsPage(offset: number, limit = 25): Promise<WalletTxPage> {
  const client = await getSage();
  if (!client || !(await capabilities.ensure("wallet.get_transactions"))) return { items: [], total: 0, offset };
  const res = asRaw(await client.wallet.getTransactions({ offset, limit, ascending: false, find_value: null }).catch(() => null));
  return { items: (res.transactions as unknown[] | undefined ?? []).map(toWalletTx), total: num(res.total) ?? 0, offset };
}

/** One page of the wallet's coins, newest first. */
export async function fetchWalletCoinsPage(offset: number, limit = 50): Promise<WalletCoinPage> {
  const client = await getSage();
  if (!client || !(await capabilities.ensure("wallet.get_coins"))) return { items: [], total: 0, offset };
  const res = asRaw(await client.wallet.getCoins({ offset, limit, ascending: false } as never).catch(() => null));
  return { items: (res.coins as unknown[] | undefined ?? []).map(toWalletCoin), total: num(res.total) ?? 0, offset };
}

export interface WalletAsset {
  kind: "xch" | "cat" | "nft" | "did";
  /** Hex asset id / launcher id; null for XCH. */
  assetId: string | null;
  name: string | null;
  ticker: string | null;
  precision: number;
  iconUrl: string | null;
  /** Number of loaded transactions touching the asset. */
  txCount: number;
}

function kindOfRef(ref: WalletCoinRef): WalletAsset["kind"] {
  const k = ref.assetKind.toLowerCase();
  if (k.includes("nft")) return "nft";
  if (k.includes("did")) return "did";
  if (k.includes("cat") || k.includes("token") || (ref.assetId && !k.includes("xch"))) return "cat";
  return "xch";
}

/** Distinct assets seen in the loaded history (XCH first, then by activity), pure and testable. */
export function deriveAssets(txs: WalletTx[]): WalletAsset[] {
  const map = new Map<string, WalletAsset>();
  map.set("xch", { kind: "xch", assetId: null, name: "Chia", ticker: "XCH", precision: 12, iconUrl: null, txCount: 0 });
  txs.forEach((tx) => {
    const seen = new Set<string>();
    [...tx.spent, ...tx.created].forEach((ref) => {
      const kind = kindOfRef(ref);
      const key = kind === "xch" ? "xch" : `${kind}:${ref.assetId ?? "?"}`;
      const existing = map.get(key) ?? { kind, assetId: kind === "xch" ? null : ref.assetId, name: ref.assetName, ticker: ref.ticker, precision: ref.precision, iconUrl: ref.iconUrl, txCount: 0 };
      if (!existing.name && ref.assetName) existing.name = ref.assetName;
      if (!existing.ticker && ref.ticker) existing.ticker = ref.ticker;
      if (!existing.iconUrl && ref.iconUrl) existing.iconUrl = ref.iconUrl;
      if (!seen.has(key)) {
        existing.txCount += 1;
        seen.add(key);
      }
      map.set(key, existing);
    });
  });
  return [...map.values()].sort((a, b) => (a.kind === "xch" ? -1 : b.kind === "xch" ? 1 : b.txCount - a.txCount));
}

export interface WalletAssetBalance {
  confirmed: bigint;
  spendable: bigint;
  coins: number;
}

/** Balance of one asset from the wallet (XCH when assetId is null). */
export async function fetchAssetBalance(kind: WalletAsset["kind"], assetId: string | null): Promise<WalletAssetBalance | null> {
  const client = await getSage();
  if (!client || !(await capabilities.ensure("wallet.get_asset_balance"))) return null;
  try {
    const res = asRaw(await client.wallet.getAssetBalance(kind === "xch" ? {} : { type: kind, assetId: assetId ? `0x${assetId}` : null }));
    return { confirmed: big(res.confirmed), spendable: big(res.spendable), coins: num(res.spendableCoinCount) ?? 0 };
  } catch {
    return null;
  }
}

/** Merge pages in offset order, dropping duplicates by id/height (pure). */
export function mergePages<T extends { offset: number; items: unknown[] }>(pages: T[]): T["items"] {
  return [...pages].sort((a, b) => a.offset - b.offset).flatMap((p) => p.items);
}
