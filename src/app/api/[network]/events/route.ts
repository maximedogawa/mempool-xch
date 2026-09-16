import { NextResponse, type NextRequest } from "next/server";
import { isNetworkId } from "@/shared/config/networks";
import { getHubFor } from "@/server/registry";
import { formatSseControl, formatSseEvent, parseLastEventId, SSE_HEARTBEAT_MS, SSE_RETRY_MS } from "@/server/sse";

export const dynamic = "force-dynamic";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "last-event-id" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...CORS, "access-control-allow-methods": "GET, OPTIONS" } });
}

/**
 * Server-sent events: every hub event (peak, transaction, block, mempool_delta, live, reorg,
 * status) as it happens, one connection per tab. Reconnects replay what was missed via
 * Last-Event-ID; when the replay ring no longer covers it the client gets `resync`.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ network: string }> }) {
  const { network } = await context.params;
  if (!isNetworkId(network)) return NextResponse.json({ error: `Unknown network: ${network}` }, { status: 400, headers: CORS });
  let hub: ReturnType<typeof getHubFor>;
  try {
    hub = getHubFor(network);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502, headers: CORS });
  }
  const since = parseLastEventId(request.headers.get("last-event-id"), request.nextUrl.searchParams.get("since"));
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          cleanup();
        }
      };
      const cleanup = () => {
        unsubscribe?.();
        unsubscribe = null;
        if (heartbeat !== null) clearInterval(heartbeat);
        heartbeat = null;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      send(`retry: ${SSE_RETRY_MS}\n\n`);
      send(formatSseControl("status", { channel: hub.status().channel, seq: hub.status().seq }));
      if (since !== null) {
        const missed = hub.since(since);
        if (missed === null) send(formatSseControl("resync", { reason: "replay window exceeded" }));
        else missed.forEach((e) => send(formatSseEvent(e)));
      }
      unsubscribe = hub.on((e) => send(formatSseEvent(e)));
      heartbeat = setInterval(() => send(`: hb ${Date.now()}\n\n`), SSE_HEARTBEAT_MS);
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      unsubscribe?.();
      unsubscribe = null;
      if (heartbeat !== null) clearInterval(heartbeat);
      heartbeat = null;
    },
  });
  return new Response(stream, {
    headers: {
      ...CORS,
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
