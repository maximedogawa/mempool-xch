/** Server-sent events framing (pure, tested): one hub event → one SSE message. */
import type { SequencedEvent } from "./eventHub";

export const SSE_HEARTBEAT_MS = 15_000;
export const SSE_RETRY_MS = 2_000;

export function formatSseEvent(e: SequencedEvent): string {
  const { type, ...data } = e.event;
  // Browsers only need to know that the mempool changed, not every id (hundreds per delta).
  const payload = e.event.type === "mempool_delta" ? { added: e.event.added.length, removed: e.event.removed.length } : data;
  return `id: ${e.seq}\nevent: ${type}\ndata: ${JSON.stringify({ ...payload, at: e.at })}\n\n`;
}

export function formatSseControl(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Last-Event-ID header or ?since= query, as a sequence number; null when absent or invalid. */
export function parseLastEventId(header: string | null, query: string | null): number | null {
  const raw = header ?? query;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : null;
}
