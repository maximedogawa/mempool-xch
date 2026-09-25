/**
 * Where the badge route reads, from the server's environment (the hosted site's ONCE settings):
 *
 *   MEMPOOL_RPC_URL_MAINNET, MEMPOOL_RPC_URL_TESTNET11   a Coinset-dialect endpoint (a nodexch
 *                                                        gateway); default Coinset
 *   MEMPOOL_RPC_KEY_MAINNET, MEMPOOL_RPC_KEY_TESTNET11   its key, sent as a bearer token; server
 *                                                        side only, so a secret key is fine here
 *
 * The badge is the app's only server-side read (decision-012), so there is no server WebSocket
 * to point anywhere: the browser's stream follows the visitor's settings.
 */
export interface BadgeSource {
  url: string;
  key: string | null;
}

const COINSET: Record<string, string> = {
  mainnet: "https://api.coinset.org",
  testnet11: "https://testnet11.api.coinset.org",
};

export function badgeSource(
  network: "mainnet" | "testnet11",
  env: Record<string, string | undefined>
): BadgeSource {
  const suffix = network.toUpperCase();
  const url = env[`MEMPOOL_RPC_URL_${suffix}`]?.trim().replace(/\/$/, "") || COINSET[network]!;
  const key = env[`MEMPOOL_RPC_KEY_${suffix}`]?.trim() || null;
  return { url, key };
}
