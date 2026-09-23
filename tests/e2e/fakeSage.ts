import type { Page } from "@playwright/test";

/**
 * A fake Sage host: the SDK's getSageClient() returns window.__SAGE__ when it exists, so the
 * whole in-app integration (capabilities, network, theme, wallet reads) can run in a browser.
 * The pending list lives on window.__FAKE_SAGE_PENDING__ so a test can change it at runtime.
 */
export const FAKE_ADDRESS =
  "xch1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqs0anmqw";

export function fakePendingTx(id: string, amountMojos = 1_500_000_000_000) {
  return {
    transaction_id: id,
    submitted_at: Math.floor(Date.now() / 1000) - 20,
    fee: 5_000_000,
    spent: [
      {
        coin_id: "aa".repeat(32),
        amount: amountMojos,
        address: FAKE_ADDRESS,
        asset: {
          kind: "xch",
          asset_id: null,
          name: "Chia",
          ticker: "XCH",
          precision: 12,
          icon_url: null,
        },
      },
    ],
    created: [],
  };
}

export const FAKE_NFT_LAUNCHER_ID = "bb".repeat(32);

/**
 * Same shape as fakePendingTx, but the spent coin is an NFT (real thumbnail, not the generic
 * picture icon). `launcherId` picks which NFT, so a test can pair it with a MintGarden record
 * from mockMintGarden.ts (a clean one, or one MintGarden blocks).
 */
export function fakeNftPendingTx(id: string, launcherId = FAKE_NFT_LAUNCHER_ID) {
  return {
    transaction_id: id,
    submitted_at: Math.floor(Date.now() / 1000) - 20,
    fee: 5_000_000,
    spent: [
      {
        coin_id: "cc".repeat(32),
        amount: 1,
        address: FAKE_ADDRESS,
        asset: {
          kind: "nft",
          asset_id: launcherId,
          name: "Test NFT",
          ticker: null,
          precision: 1,
          icon_url: null,
        },
      },
    ],
    created: [],
  };
}

/** A confirmed transaction in the wallet's history (wallet.get_transactions) that received an NFT. */
export function fakeNftHistoryTx(id: string, launcherId: string, height: number) {
  const { spent } = fakeNftPendingTx(id, launcherId);
  return {
    transaction_id: id,
    height,
    timestamp: Math.floor(Date.now() / 1000) - 600,
    fee: 0,
    spent: [],
    created: spent.map((coin) => ({ ...coin, coin_id: id })),
  };
}

export async function installFakeSage(
  page: Page,
  pending: unknown[],
  granted: string[] = [
    "wallet.get_sync_status",
    "wallet.get_pending_transactions",
    "wallet.get_transactions",
    "wallet.get_coins",
    "wallet.get_xch_usd_price",
  ],
  theme: { name: string; mostLike?: string } = { name: "dark", mostLike: "dark" },
  /** The wallet's confirmed history, as wallet.get_transactions returns it. */
  history: unknown[] = []
) {
  await page.addInitScript(
    ({ pending, granted, address, theme, history }) => {
      const w = window as unknown as Record<string, unknown>;
      w.__FAKE_SAGE_PENDING__ = pending;
      const noop = () => () => {};
      // Sage's current theme; __FAKE_SAGE_SET_THEME__(theme) switches it the way the host does:
      // getCurrent answers the new theme and every onChanged listener gets { theme }.
      let currentTheme = theme;
      const themeListeners = new Set<(event: { theme: unknown }) => void>();
      w.__FAKE_SAGE_SET_THEME__ = (next: typeof theme) => {
        currentTheme = next;
        themeListeners.forEach((listener) => listener({ theme: next }));
      };
      w.__SAGE__ = {
        app: {
          getInfo: async () => ({
            id: "space.mempoolxch",
            name: "mempoolxch.space",
            version: "test",
          }),
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
          theme: {
            getCurrent: async () => ({ theme: currentTheme }),
            onChanged: (listener: (event: { theme: unknown }) => void) => {
              themeListeners.add(listener);
              return () => themeListeners.delete(listener);
            },
            // What sage-app-sdk's getSageClient() does on its own (bootstrapTheme): Sage's shadcn
            // variables in a late <style> on :root. Their names collide with the app's tokens.
            mountCssVars: async () => {
              let el = document.getElementById("sage-environment-theme-vars");
              if (!el) {
                el = document.createElement("style");
                el.id = "sage-environment-theme-vars";
                document.head.appendChild(el);
              }
              el.textContent =
                ":root { --primary: hsl(0 0% 98%); --accent: hsl(240 3.7% 15.9%); --border: hsl(240 3.7% 15.9%); --radius: 0.5rem; --background: hsl(240 10% 3.9%); }";
            },
            cssVars: async () => ({}),
          },
        },
        wallet: {
          getSyncStatus: async () => ({
            receive_address: address,
            selectable_balance: 2_000_000_000_000,
            unit: { ticker: "XCH", precision: 12 },
            synced_coins: 3,
            total_coins: 3,
          }),
          getPendingTransactions: async () => ({
            transactions: (window as unknown as { __FAKE_SAGE_PENDING__: unknown[] })
              .__FAKE_SAGE_PENDING__,
          }),
          getTransactions: async () => ({ transactions: history, total: history.length }),
          getCoins: async () => ({ coins: [], total: 0 }),
          getCoinsByIds: async () => ({ coins: [] }),
          checkAddress: async () => ({ valid: true }),
          getXchUsdPrice: async () => ({ xch_usd_price: 20 }),
          getAssetBalance: async () => ({ confirmed: "0", spendable: "0", coins: 0 }),
        },
      };
    },
    { pending, granted, address: FAKE_ADDRESS, theme, history }
  );
}
