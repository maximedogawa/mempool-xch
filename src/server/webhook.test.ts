import { describe, expect, test } from "bun:test";
import { DeliveryDedupe, handleCoinsetWebhook, signCoinsetBody, verifyCoinsetSignature } from "./webhook";

const SECRET = "whsec_test";
const NOW = 1_700_000_000_000;
const body = JSON.stringify({ region: "fmt", seq: 1, message: { type: "peak", data: { height: 42, tx: true } } });

function headersFor(overrides: Record<string, string | null> = {}) {
  const base: Record<string, string | null> = {
    "x-coinset-timestamp-ms": String(NOW),
    "x-coinset-signature": signCoinsetBody(SECRET, NOW, body),
    "x-coinset-event-id": "evt-1",
    ...overrides,
  };
  return (name: string) => base[name.toLowerCase()] ?? null;
}

describe("Coinset webhook receiver", () => {
  test("signature is HMAC-SHA256 over '<timestamp>.' + raw body", () => {
    const sig = signCoinsetBody(SECRET, NOW, body);
    expect(verifyCoinsetSignature(SECRET, String(NOW), body, sig)).toBe(true);
    expect(verifyCoinsetSignature(SECRET, String(NOW + 1), body, sig)).toBe(false);
    expect(verifyCoinsetSignature("other", String(NOW), body, sig)).toBe(false);
    expect(verifyCoinsetSignature(SECRET, String(NOW), body, "zz")).toBe(false);
  });

  test("answers the verification handshake with the challenge", () => {
    const out = handleCoinsetWebhook({ headers: () => null, rawBody: JSON.stringify({ type: "coinset.webhook.verify", hook_id: "h", challenge: "c-123" }), secret: SECRET, now: NOW }, new DeliveryDedupe());
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ challenge: "c-123" });
    expect(out.events).toEqual([]);
  });

  test("a valid delivery becomes hub events", () => {
    const out = handleCoinsetWebhook({ headers: headersFor(), rawBody: body, secret: SECRET, now: NOW }, new DeliveryDedupe());
    expect(out.status).toBe(200);
    expect(out.events).toEqual([{ type: "peak", height: 42, tx: true }]);
  });

  test("rejects bad signatures, stale timestamps and missing headers", () => {
    const dedupe = new DeliveryDedupe();
    expect(handleCoinsetWebhook({ headers: headersFor({ "x-coinset-signature": signCoinsetBody("wrong", NOW, body) }), rawBody: body, secret: SECRET, now: NOW }, dedupe).status).toBe(401);
    expect(handleCoinsetWebhook({ headers: headersFor(), rawBody: body, secret: SECRET, now: NOW + 6 * 60_000 }, dedupe).status).toBe(401);
    expect(handleCoinsetWebhook({ headers: headersFor({ "x-coinset-signature": null }), rawBody: body, secret: SECRET, now: NOW }, dedupe).status).toBe(401);
    expect(handleCoinsetWebhook({ headers: headersFor(), rawBody: body, secret: null, now: NOW }, dedupe).status).toBe(503);
  });

  test("redeliveries with the same event id are acknowledged without events", () => {
    const dedupe = new DeliveryDedupe();
    const first = handleCoinsetWebhook({ headers: headersFor(), rawBody: body, secret: SECRET, now: NOW }, dedupe);
    const second = handleCoinsetWebhook({ headers: headersFor(), rawBody: body, secret: SECRET, now: NOW }, dedupe);
    expect(first.events).toHaveLength(1);
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ duplicate: true });
    expect(second.events).toEqual([]);
  });

  test("test deliveries are accepted and ignored", () => {
    const testBody = JSON.stringify({ message: { type: "coinset.webhook.test", data: {} } });
    const out = handleCoinsetWebhook({ headers: headersFor({ "x-coinset-signature": signCoinsetBody(SECRET, NOW, testBody) }), rawBody: testBody, secret: SECRET, now: NOW }, new DeliveryDedupe());
    expect(out.status).toBe(200);
    expect(out.events).toEqual([]);
  });
});
