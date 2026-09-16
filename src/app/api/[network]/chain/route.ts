import { NextResponse, type NextRequest } from "next/server";
import { isNetworkId } from "@/shared/config/networks";
import { stringifyJsonTagged } from "@/shared/lib/rpc/json";
import { getChain } from "@/server/registry";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Cached blockchain state, recent block records (+ stats) and the reference fee estimate. */
export async function GET(request: NextRequest, context: { params: Promise<{ network: string }> }) {
  const { network } = await context.params;
  if (!isNetworkId(network)) return NextResponse.json({ error: `Unknown network: ${network}` }, { status: 400, headers: CORS });
  try {
    const cache = getChain(network);
    if (!cache.ready) await cache.refreshAll();
    const limit = Math.min(80, Math.max(1, Number(request.nextUrl.searchParams.get("blocks") ?? 80) || 80));
    const snapshot = cache.snapshot(limit);
    if (!snapshot) return NextResponse.json({ error: "Chain cache not ready" }, { status: 503, headers: { ...CORS, "retry-after": "2" } });
    return new NextResponse(stringifyJsonTagged(snapshot), {
      headers: { ...CORS, "content-type": "application/json", "cache-control": "public, max-age=1, stale-while-revalidate=5" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: /refusing/.test(message) ? 400 : 502, headers: CORS });
  }
}
