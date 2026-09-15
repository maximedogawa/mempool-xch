import { NextResponse, type NextRequest } from "next/server";
import { isNetworkId } from "@/shared/config/networks";
import { getSyncer } from "@/server/mempoolSummary";

export const dynamic = "force-dynamic";

// CORS is open so the Sage snapshot (served from sage-app://) and other origins can read the
// summary; it exposes only public chain data.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ network: string }> }) {
  const { network } = await context.params;
  if (!isNetworkId(network)) {
    return NextResponse.json({ error: `Unknown network: ${network}` }, { status: 400, headers: CORS });
  }
  try {
    const summary = await getSyncer(network).getSummary();
    return NextResponse.json(summary, {
      headers: { ...CORS, "cache-control": "public, max-age=2, stale-while-revalidate=5" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = /refusing/.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status, headers: CORS });
  }
}
