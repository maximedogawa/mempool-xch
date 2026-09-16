import { NextResponse, type NextRequest } from "next/server";
import { isNetworkId } from "@/shared/config/networks";
import { getHub, hasHub } from "@/server/eventHub";
import { getSyncer } from "@/server/mempoolSummary";

export const dynamic = "force-dynamic";
const CORS = { "access-control-allow-origin": "*", "cache-control": "no-store" };

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
        now: Date.now(),
      },
      { headers: CORS }
    );
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: CORS });
  }
}
