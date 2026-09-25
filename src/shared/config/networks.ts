/** Networks the app knows about. Endpoints can be overridden per network in settings. */
export type NetworkId = "mainnet" | "testnet11";

/**
 * Who answers an endpoint. Coinset and nodexch speak the same dialect (full-node RPC, the
 * indexed API and the WebSocket on one host); a custom node has the full-node RPC only.
 */
export type Provider = "coinset" | "nodexch" | "custom";

export interface NetworkConfig {
  id: NetworkId;
  label: string;
  /** bech32m human-readable part for addresses. */
  addressPrefix: "xch" | "txch";
  /** Default full-node RPC base URL (Coinset). */
  rpcUrl: string;
  /** Default indexed API base URL (Coinset; same host as the RPC today). */
  indexedUrl: string;
  /** Default WebSocket event stream (Coinset). */
  wsUrl: string;
  /** Hosts recognised as Coinset: unlock the indexed API, the WebSocket and the summary API. */
  coinsetHosts: string[];
  /** The hosted nodexch gateway for this network (the settings preset); null where none runs. */
  nodexchUrl: string | null;
  /** Its publishable key for this site (baked in at build time); empty without one. */
  nodexchKey: string;
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  mainnet: {
    id: "mainnet",
    label: "Mainnet",
    addressPrefix: "xch",
    rpcUrl: "https://api.coinset.org",
    indexedUrl: "https://api.coinset.org",
    wsUrl: "wss://api.coinset.org/ws",
    coinsetHosts: ["api.coinset.org", "coinset.org", "www.coinset.org"],
    nodexchUrl: "https://nodexch.space",
    nodexchKey: process.env.NEXT_PUBLIC_NODEXCH_KEY_MAINNET ?? "",
  },
  testnet11: {
    id: "testnet11",
    label: "Testnet11",
    addressPrefix: "txch",
    rpcUrl: "https://testnet11.api.coinset.org",
    indexedUrl: "https://testnet11.api.coinset.org",
    wsUrl: "wss://testnet11.api.coinset.org/ws",
    coinsetHosts: ["testnet11.api.coinset.org"],
    nodexchUrl: null,
    nodexchKey: process.env.NEXT_PUBLIC_NODEXCH_KEY_TESTNET11 ?? "",
  },
};

export const NETWORK_IDS = Object.keys(NETWORKS) as NetworkId[];

export function isNetworkId(value: string): value is NetworkId {
  return value in NETWORKS;
}

/** True when the base URL points at Coinset, which unlocks the indexed API and WebSocket. */
export function isCoinsetUrl(network: NetworkId, url: string): boolean {
  try {
    return NETWORKS[network].coinsetHosts.includes(new URL(url).host);
  } catch {
    return false;
  }
}

/** True when the base URL is the hosted nodexch gateway of this network. */
export function isNodexchUrl(network: NetworkId, url: string): boolean {
  const preset = NETWORKS[network].nodexchUrl;
  if (!preset) return false;
  try {
    return new URL(preset).host === new URL(url).host;
  } catch {
    return false;
  }
}

/**
 * Who answers `url`: Coinset by host, nodexch by host or because the user said so for their own
 * gateway (`declared`), anything else a custom node.
 */
export function providerOf(network: NetworkId, url: string, declared?: Provider): Provider {
  if (isCoinsetUrl(network, url)) return "coinset";
  if (declared === "nodexch" || isNodexchUrl(network, url)) return "nodexch";
  return "custom";
}

/** Chia consensus constants used by the visualisations. */
export const CHIA = {
  /** Maximum CLVM cost per transaction block (also returned by get_blockchain_state). */
  BLOCK_MAX_COST: 11_000_000_000,
  /** Target seconds between blocks (transaction or not). */
  TARGET_BLOCK_TIME_S: 18.75,
  /** Roughly 1 in 3 blocks carries transactions in steady state. */
  TX_BLOCK_RATIO: 0.36,
  /** Cost of a typical single XCH send, the reference for fee cards. */
  REFERENCE_SPEND_COST: 6_000_000,
  MOJOS_PER_XCH: 1_000_000_000_000n,
  /** CATs use 3 decimals (1000 mojos per CAT unit). */
  MOJOS_PER_CAT: 1_000n,
} as const;
