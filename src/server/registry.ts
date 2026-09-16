/**
 * One place that wires the per-network server singletons together: the Coinset event hub
 * (started by the mempool syncer), the mempool syncer and the chain cache.
 */
import { NETWORKS, isCoinsetUrl, type NetworkId } from "@/shared/config/networks";
import { createRpcClient, type RpcClientOptions } from "@/shared/lib/rpc/client";
import { getChainCache, type ChainCache } from "./chainCache";
import { meteredFetch } from "./coinsetMeter";
import { getHub, hasHub, type CoinsetHub } from "./eventHub";
import { getSyncer } from "./mempoolSummary";

/** The hub for a network, creating the syncer (which starts the hub) on first use. */
export function getHubFor(network: NetworkId): CoinsetHub {
  if (!hasHub(network)) getSyncer(network);
  return getHub(network);
}

export function serverRpcUrl(network: NetworkId): string {
  return process.env[`MEMPOOL_RPC_URL_${network.toUpperCase()}`] ?? NETWORKS[network].rpcUrl;
}

/** Headers for server-side Coinset calls: the API key as a bearer token when configured. */
export function serverRpcHeaders(env: Record<string, string | undefined> = process.env): Record<string, string> {
  const key = env.COINSET_API_KEY?.trim();
  return key ? { authorization: `Bearer ${key}` } : {};
}

/** Options every server-side RPC client shares (URL override, key, timeout). */
export function serverClientOptions(network: NetworkId): RpcClientOptions {
  const rpcUrl = serverRpcUrl(network);
  return { rpcUrl, indexedUrl: isCoinsetUrl(network, rpcUrl) ? NETWORKS[network].indexedUrl : null, timeoutMs: 15_000, headers: serverRpcHeaders(), fetchImpl: meteredFetch() };
}

export function getChain(network: NetworkId): ChainCache {
  const rpcUrl = serverRpcUrl(network);
  if (!isCoinsetUrl(network, rpcUrl)) throw new Error(`Chain cache only proxies Coinset hosts; refusing ${rpcUrl}`);
  const hub = getHubFor(network);
  return getChainCache(network, { client: createRpcClient(serverClientOptions(network)), hub });
}
