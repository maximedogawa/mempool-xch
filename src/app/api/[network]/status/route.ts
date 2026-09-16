import { NextResponse, type NextRequest } from "next/server";
import { isNetworkId } from "@/shared/config/networks";
import { coinsetMeter } from "@/server/coinsetMeter";
import { getHub, hasHub } from "@/server/eventHub";
import { getSyncer } from "@/server/mempoolSummary";
import { getChainCache } from "@/server/chainCache";

export const dynamic = "force-dynamic";
const CORS = { "access-control-allow-origin": "*", "cache-control": "no-store" };

function chainCounters(network: Parameters<typeof getChainCache>[0]): Record<string, number> | null {
  try {
    return getChainCache(network).counters;
  } catch {
    return null;
  }
}

/** Live channel and counters of the server-side Coinset connection. */
export async function GET(_request: NextRequest, context: { params: Promise<{ network: string }> }) {
  const { network } = await context.params;
  if (!isNetworkId(network)) return NextResponse.json({ error: `Unknown network: ${network}` }, { status: 400, headers: CORS });
  try {
    const syncer = getSyncer(network);
    const hub = hasHub(network) ? getHub(network).status() : null;
    const snapshot = syncer.snapshot();
    return NextResponse.json(
      {
        network,
        hub,
        mempool: { items: snapshot.items.length, generatedAt: snapshot.generatedAt, stats: syncer.stats, pending: syncer.pendingCount },
        blockStats: hasHub(network) ? getHub(network).blockStats.size : 0,
        /** Server-side Coinset calls (all networks) since start. */
        coinset: coinsetMeter.snapshot(),
        chain: chainCounters(network),
        now: Date.now(),
      },
      { headers: CORS }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: CORS });
  }
}
