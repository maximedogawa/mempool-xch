import { FEATURES } from "./features";
import type { NetworkId } from "./networks";

/** A duel platform built on the Chia gaming protocol whose tracker the browser can read (CORS). */
export interface GamingProvider {
  id: "nokitlan";
  name: string;
  /** JSON API: /games, /rooms, /leaderboard, /health. Sends Access-Control-Allow-Origin: *. */
  trackerUrl: string;
  /** The playable app. Hash-routed and not frameable, so every action opens it in a new tab. */
  appUrl: string;
}

/**
 * Gaming per network. nokitlan runs on testnet11 today; a mainnet tracker becomes one more entry
 * here (plus its host in the Sage manifest whitelist), not new UI.
 */
const PROVIDERS: Partial<Record<NetworkId, GamingProvider>> = {
  testnet11: {
    id: "nokitlan",
    name: "nokitlan",
    trackerUrl: "https://tracker.nokitlan.com",
    appUrl: "https://testnet.nokitlan.com",
  },
};

export function gamingProviderFor(network: NetworkId): GamingProvider | null {
  if (network === "testnet11" && !FEATURES.gamingTestnet) return null;
  return PROVIDERS[network] ?? null;
}

/** The first network with a live gaming provider, the target of the mainnet "switch" button. */
export function gamingNetwork(): NetworkId | null {
  return (Object.keys(PROVIDERS) as NetworkId[]).find((n) => gamingProviderFor(n)) ?? null;
}
