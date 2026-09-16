import { NextResponse, type NextRequest } from "next/server";
import { isNetworkId, type NetworkId } from "@/shared/config/networks";
import { getHubFor } from "@/server/registry";
import { DeliveryDedupe, handleCoinsetWebhook } from "@/server/webhook";

export const dynamic = "force-dynamic";

const dedupe = new DeliveryDedupe();

/**
 * Coinset webhook receiver: register `https://<host>/api/webhooks/coinset?network=mainnet` with
 * filter {"events":["peak","transaction","reorg"]} and put the returned secret in
 * COINSET_WEBHOOK_SECRET. Verified deliveries feed the same hub as the WebSocket.
 */
export async function POST(request: NextRequest) {
  const networkParam = request.nextUrl.searchParams.get("network") ?? "mainnet";
  if (!isNetworkId(networkParam)) return NextResponse.json({ error: `Unknown network: ${networkParam}` }, { status: 400 });
  const network: NetworkId = networkParam;
  const rawBody = await request.text();
  const outcome = handleCoinsetWebhook(
    { headers: (name) => request.headers.get(name), rawBody, secret: process.env.COINSET_WEBHOOK_SECRET?.trim() || null },
    dedupe
  );
  if (outcome.events.length > 0) {
    try {
      const hub = getHubFor(network);
      outcome.events.forEach((event) => hub.emit(event, "webhook"));
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
    }
  }
  return NextResponse.json(outcome.body, { status: outcome.status });
}
