/**
 * Coinset webhook receiver logic (TASK-035, decision-006): verification handshake, HMAC-SHA256
 * signature check over "<timestamp_ms>." + raw body, stale-timestamp rejection, idempotency by
 * X-Coinset-Event-Id, and the delivery envelope (same shape as a WebSocket frame) fed into the
 * hub as a second push channel. Pure apart from the hub call, so it is unit-testable.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { parseCoinsetFrame, type HubEvent } from "./eventHub";

export const TIMESTAMP_TOLERANCE_MS = 5 * 60_000;
const DEDUPE_KEEP = 2_000;

export function signCoinsetBody(secret: string, timestampMs: string | number, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestampMs}.`).update(rawBody).digest("hex");
}

export function verifyCoinsetSignature(secret: string, timestampMs: string, rawBody: string, signatureHex: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(signatureHex)) return false;
  const expected = Buffer.from(signCoinsetBody(secret, timestampMs, rawBody), "hex");
  const given = Buffer.from(signatureHex, "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Remembers the last few thousand event ids so redelivered events are acknowledged, not replayed. */
export class DeliveryDedupe {
  private readonly seen = new Set<string>();
  /** True when the id is new (and now remembered). */
  add(id: string): boolean {
    if (this.seen.has(id)) return false;
    this.seen.add(id);
    if (this.seen.size > DEDUPE_KEEP) {
      const oldest = this.seen.values().next().value;
      if (oldest !== undefined) this.seen.delete(oldest);
    }
    return true;
  }
}

export interface WebhookInput {
  headers: (name: string) => string | null;
  rawBody: string;
  secret: string | null;
  now?: number;
}

export interface WebhookOutcome {
  status: number;
  body: Record<string, unknown>;
  /** Events to feed into the hub (empty for handshake, test, duplicate or rejected deliveries). */
  events: HubEvent[];
}

/** Decide how to answer one delivery; the route feeds `events` into the hub. */
export function handleCoinsetWebhook(input: WebhookInput, dedupe: DeliveryDedupe): WebhookOutcome {
  if (!input.secret) return { status: 503, body: { error: "Webhook receiver disabled: COINSET_WEBHOOK_SECRET is not set" }, events: [] };
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input.rawBody) as Record<string, unknown>;
  } catch {
    return { status: 400, body: { error: "Body is not JSON" }, events: [] };
  }
  // Verification handshake: unsigned by design; echo the challenge.
  if (parsed.type === "coinset.webhook.verify") {
    const challenge = typeof parsed.challenge === "string" ? parsed.challenge : input.headers("x-coinset-webhook-challenge");
    return { status: 200, body: { challenge }, events: [] };
  }
  const timestamp = input.headers("x-coinset-timestamp-ms");
  const signature = input.headers("x-coinset-signature");
  if (!timestamp || !signature) return { status: 401, body: { error: "Missing signature headers" }, events: [] };
  const now = input.now ?? Date.now();
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > TIMESTAMP_TOLERANCE_MS) return { status: 401, body: { error: "Stale or invalid timestamp" }, events: [] };
  if (!verifyCoinsetSignature(input.secret, timestamp, input.rawBody, signature)) return { status: 401, body: { error: "Bad signature" }, events: [] };
  const eventId = input.headers("x-coinset-event-id");
  if (eventId && !dedupe.add(eventId)) return { status: 200, body: { ok: true, duplicate: true }, events: [] };
  const message = parsed.message && typeof parsed.message === "object" ? (parsed.message as Record<string, unknown>) : null;
  if (message?.type === "coinset.webhook.test") return { status: 200, body: { ok: true, test: true }, events: [] };
  const events = parseCoinsetFrame(input.rawBody);
  return { status: 200, body: { ok: true, events: events.length }, events };
}
