"use client";

/**
 * Wallet data straight from the Sage host (only inside Sage). Sage is a light wallet, not a
 * full node: it knows your addresses, balances, coins and transactions, but not the mempool or
 * other people's blocks, so chain-wide data keeps coming from the configured RPC endpoint.
 */
import { getSage } from "./bridge";

export const WALLET_CAPABILITIES = ["wallet.get_sync_status", "wallet.get_pending_transactions", "wallet.get_transactions", "wallet.get_coins"] as const;

export interface WalletCoinRef {
  coinId: string;
  amount: bigint;
  address: string | null;
  assetKind: string;
  assetId: string | null;
  assetName: string | null;
  ticker: string | null;
  precision: number;
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
  };
}

async function granted(): Promise<string[]> {
  const client = await getSage();
  if (!client) return [];
  const list: string[] = [];
  try {
    const caps = await client.app.getCapabilities();
    const have = (caps as { granted?: string[]; capabilities?: string[] }).granted ?? (caps as { capabilities?: string[] }).capabilities ?? [];
    list.push(...have);
  } catch {
    return [];
  }
  const missing = WALLET_CAPABILITIES.filter((c) => !list.includes(c));
  await Promise.all(
    missing.map(async (capability) => {
      try {
        const result = await client.app.requestCapabilityGrant({ capability: capability as never });
        if ((result as { granted?: boolean }).granted ?? (result as { ok?: boolean }).ok) list.push(capability);
      } catch {
        // Refused: the section that needs it stays hidden.
      }
    })
  );
  return list;
}

export async function fetchWalletOverview(): Promise<WalletOverview | null> {
  const client = await getSage();
  if (!client) return null;
  const caps = await granted();
  const has = (c: string) => caps.includes(c);
  const status = has("wallet.get_sync_status") ? await client.wallet.getSyncStatus().catch(() => null) : null;
  const pendingRes = has("wallet.get_pending_transactions") ? await client.wallet.getPendingTransactions().catch(() => null) : null;
  const txRes = has("wallet.get_transactions") ? await client.wallet.getTransactions({ offset: 0, limit: 25, ascending: false, find_value: null }).catch(() => null) : null;
  const coinsRes = has("wallet.get_coins") ? await client.wallet.getCoins({ offset: 0, limit: 50, ascending: false } as never).catch(() => null) : null;
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
    granted: caps,
  };
}
