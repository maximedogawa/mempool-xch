/**
 * What this app shares with a nodexch gateway beyond Coinset's dialect (nodexch TASK-147 to
 * TASK-153): the dashboard start call that a load's queries share, the memory of routes an
 * older gateway lacks, and where the gateway's block totals are kept for the cubes.
 */
import type { QueryClient } from "@tanstack/react-query";
import type { NetworkId } from "@/shared/config/networks";
import { saveCachedTotals } from "@/shared/lib/blocks/totalsCache";
import type { GatewayBlockTotals, GatewayDashboard } from "@/shared/lib/nodexch/dashboard";
import type { RpcClient } from "@/shared/lib/rpc/client";
import type { BlockchainState } from "@/shared/lib/rpc/types";
import { queryKeys } from "./queryKeys";

function browserStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * A nodexch gateway older than one of its routes answers 404: the route is asked again after
 * this, not on every load (remembered in localStorage, per gateway and route).
 */
const ROUTE_OFF_RETRY_MS = 60 * 60_000;
const ROUTE_OFF_KEY = "mempool-xch:nodexch-routes-off:v1";

export function routeOff(client: RpcClient, path: string): boolean {
  if (!client.metered) return true;
  try {
    const raw = JSON.parse(browserStorage()?.getItem(ROUTE_OFF_KEY) ?? "null") as Record<
      string,
      unknown
    > | null;
    const until = raw?.[`${client.rpcUrl}${path}`];
    return typeof until === "number" && Date.now() < until;
  } catch {
    return false;
  }
}

export function markRouteOff(client: RpcClient, path: string): void {
  if (!client.metered) return;
  try {
    const storage = browserStorage();
    const raw = JSON.parse(storage?.getItem(ROUTE_OFF_KEY) ?? "null") as Record<
      string,
      unknown
    > | null;
    storage?.setItem(
      ROUTE_OFF_KEY,
      JSON.stringify({
        ...(raw && typeof raw === "object" ? raw : {}),
        [`${client.rpcUrl}${path}`]: Date.now() + ROUTE_OFF_RETRY_MS,
      })
    );
  } catch {
    // Without storage the gateway is simply asked again on the next load.
  }
}

const DASHBOARD_PATH = "/x/node/v1/dashboard";
export const MEMPOOL_ITEMS_PATH = "/x/node/v1/mempool/items";
/** The queries of one load start within this of each other and share the one call. */
const DASHBOARD_SHARE_MS = 10_000;
const dashboardStarts = new WeakMap<
  RpcClient,
  { at: number; promise: Promise<GatewayDashboard | null> }
>();

/**
 * A nodexch gateway's dashboard start call (`GET /x/node/v1/dashboard`, nodexch TASK-152): the
 * state, the fee quote, the recent blocks with their records and totals and the mempool items
 * in one paid request. The queries of a load share one call; a later single refresh makes a
 * call of its own, as cheap in requests as the route it stands in for. Null on any other
 * provider, on a gateway without the route, or when the call fails: each query then asks its
 * own route as before.
 */
export function dashboardStart(client: RpcClient): Promise<GatewayDashboard | null> {
  if (!client.metered || routeOff(client, DASHBOARD_PATH)) return Promise.resolve(null);
  const shared = dashboardStarts.get(client);
  if (shared && Date.now() - shared.at < DASHBOARD_SHARE_MS) return shared.promise;
  const entry = { at: Date.now(), promise: Promise.resolve<GatewayDashboard | null>(null) };
  entry.promise = client.getDashboard().then(
    (dashboard) => {
      if (!dashboard) markRouteOff(client, DASHBOARD_PATH);
      return dashboard;
    },
    () => {
      // Not remembered: the next load tries the one call again.
      if (dashboardStarts.get(client) === entry) dashboardStarts.delete(client);
      return null;
    }
  );
  dashboardStarts.set(client, entry);
  return entry.promise;
}

/** The blockchain state: from the load's shared dashboard call on a gateway, else asked for. */
export async function fetchBlockchainState(
  client: RpcClient,
  signal?: AbortSignal
): Promise<BlockchainState> {
  const dashboard = await dashboardStart(client);
  return dashboard?.state ?? client.getBlockchainState(signal);
}

/**
 * A gateway's totals for transaction blocks (the dashboard call, a block frame) go where the
 * cubes and the block page look first: the query cache and the per-block localStorage cache.
 */
export function seedBlockTotals(
  queryClient: QueryClient,
  network: NetworkId,
  totals: GatewayBlockTotals[]
): void {
  totals.forEach(({ height, hash, totals: value }) => {
    saveCachedTotals(browserStorage(), network, { height, hash }, value);
    for (const part of ["preview", "detail"] as const)
      queryClient.setQueryData(
        queryKeys.blockTotals(network, height, hash, "gateway", part),
        value
      );
  });
}
