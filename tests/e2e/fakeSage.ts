import type { Page } from "@playwright/test";

/**
 * A fake Sage host: the SDK's getSageClient() returns window.__SAGE__ when it exists, so the
 * whole in-app integration (capabilities, network, theme, wallet reads) can run in a browser.
 * The pending list lives on window.__FAKE_SAGE_PENDING__ so a test can change it at runtime.
 */
export const FAKE_ADDRESS = "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0anmqw";

export function fakePendingTx(id: string, amountMojos = 1_500_000_000_000) {
  return {
    transaction_id: id,
    submitted_at: Math.floor(Date.now() / 1000) - 20,
    fee: 5_000_000,
    spent: [{ coin_id: "aa".repeat(32), amount: amountMojos, address: FAKE_ADDRESS, asset: { kind: "xch", asset_id: null, name: "Chia", ticker: "XCH", precision: 12, icon_url: null } }],
    created: [],
  };
}

export const FAKE_NFT_LAUNCHER_ID = "bb".repeat(32);

/** Same shape as fakePendingTx, but the spent coin is an NFT (TASK-054: real thumbnail, not the generic picture icon). */
export function fakeNftPendingTx(id: string) {
  return {
    transaction_id: id,
    submitted_at: Math.floor(Date.now() / 1000) - 20,
    fee: 5_000_000,
    spent: [{ coin_id: "cc".repeat(32), amount: 1, address: FAKE_ADDRESS, asset: { kind: "nft", asset_id: FAKE_NFT_LAUNCHER_ID, name: "Test NFT", ticker: null, precision: 1, icon_url: null } }],
    created: [],
  };
}

export async function installFakeSage(page: Page, pending: unknown[], granted: string[] = ["wallet.get_sync_status", "wallet.get_pending_transactions", "wallet.get_transactions", "wallet.get_coins", "wallet.get_xch_usd_price"]) {
  await page.addInitScript(
    ({ pending, granted, address }) => {
      const w = window as unknown as Record<string, unknown>;
      w.__FAKE_SAGE_PENDING__ = pending;
      const noop = () => () => {};
      w.__SAGE__ = {
        app: {
          getInfo: async () => ({ id: "space.mempoolxch", name: "mempoolxch.space", version: "test" }),
          getCapabilities: async () => ({ full: granted, granted, capabilities: granted }),
          requestCapabilityGrant: async ({ capability }: { capability: string }) => {
            granted.push(capability);
            return { granted: true };
          },
          requestNetworkWhitelistGrant: async () => ({ granted: true }),
          onGrantedCapabilitiesChange: noop,
          lifecycle: { setBeforeStopListener: noop, readyToStop: async () => {} },
        },
        environment: {
          getNetwork: async () => ({ kind: "mainnet", networkId: "mainnet" }),
          theme: { getCurrent: async () => ({ theme: { name: "dark", mostLike: "dark" } }), onChanged: noop, mountCssVars: async () => {}, cssVars: async () => ({}) },
        },
        wallet: {
          getSyncStatus: async () => ({ receive_address: address, selectable_balance: 2_000_000_000_000, unit: { ticker: "XCH", precision: 12 }, synced_coins: 3, total_coins: 3 }),
          getPendingTransactions: async () => ({ transactions: (window as unknown as { __FAKE_SAGE_PENDING__: unknown[] }).__FAKE_SAGE_PENDING__ }),
          getTransactions: async () => ({ transactions: [], total: 0 }),
          getCoins: async () => ({ coins: [], total: 0 }),
          getCoinsByIds: async () => ({ coins: [] }),
          checkAddress: async () => ({ valid: true }),
          getXchUsdPrice: async () => ({ xch_usd_price: 20 }),
          getAssetBalance: async () => ({ confirmed: "0", spendable: "0", coins: 0 }),
        },
      };
    },
    { pending, granted, address: FAKE_ADDRESS }
  );
}
