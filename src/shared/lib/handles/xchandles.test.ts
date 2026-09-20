import { describe, expect, test } from "bun:test";
import liveHandle from "@/test-utils/fixtures/xchandlesHandle.json";
import {
  fetchHandle,
  fetchHandleRegistration,
  formatHandle,
  isHandle,
  parseHandle,
  type HandleResponse,
} from "./xchandles";

function respond(status: number, body: unknown = {}): Promise<HandleResponse> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("parseHandle", () => {
  test("accepts 3-63 lowercase letters and digits, folding case", () => {
    expect(parseHandle("yakuhito")).toBe("yakuhito");
    expect(parseHandle("  MempoolXCH  ")).toBe("mempoolxch");
    expect(parseHandle("a1".repeat(30))).toBe("a1".repeat(30));
    expect(isHandle("abc")).toBe(true);
  });

  test("takes the @ people write a handle with, and gives back the registry's bare key", () => {
    expect(parseHandle("@maximedogawa")).toBe("maximedogawa");
    expect(parseHandle(" @MaximEdogawa ")).toBe("maximedogawa");
    // Only the one the user typed: @ is not part of a handle, so a second one is not a handle.
    expect(parseHandle("@@maximedogawa")).toBeNull();
    expect(parseHandle("maxim@edogawa")).toBeNull();
    expect(parseHandle("@")).toBeNull();
    expect(formatHandle("maximedogawa")).toBe("@maximedogawa");
  });

  test("rejects shapes the registry does not issue, including Namesdao .xch names", () => {
    expect(parseHandle("ab")).toBeNull();
    expect(parseHandle("a".repeat(64))).toBeNull();
    expect(parseHandle("has-dash")).toBeNull();
    expect(parseHandle("has.dot")).toBeNull();
    expect(parseHandle("yakuhito.xch")).toBeNull();
    expect(parseHandle("")).toBeNull();
  });
});

describe("fetchHandle", () => {
  test("reads the live payload of a registered handle", async () => {
    const urls: string[] = [];
    const record = await fetchHandle("mempoolxch", (url) => {
      urls.push(url);
      return respond(200, liveHandle);
    });
    expect(urls).toEqual(["https://api.xchandles.com/handle/mempoolxch"]);
    expect(record).toEqual({
      status: "active",
      handle: "mempoolxch",
      expiration: 1821462266,
      ownerLauncherId: "551fc5bfe0f30ed7ea6f22d89221ac9c1f5fe053f62282bf8257c5bb6ed48db2",
      resolvedLauncherId: "551fc5bfe0f30ed7ea6f22d89221ac9c1f5fe053f62282bf8257c5bb6ed48db2",
      p2PuzzleHash: "cdf3cbcfee6c99476082fdcfd6b818a579011482c615781028db263f2413d14c",
      registryLauncherId: "6f314f69a9cf776311e1c7781a3013e4daae3696c71d8a04d049a5af1530f050",
      indexedPeakHeight: liveHandle.indexed_peak_height,
    });
  });

  test("a slot whose term has already passed reads as expired, not active", async () => {
    const record = await fetchHandle("mempoolxch", () =>
      respond(200, { ...liveHandle, slot: { ...liveHandle.slot, expiration: 1_600_000_000 } })
    );
    expect(record.status).toBe("expired");
    expect(record.expiration).toBe(1_600_000_000);
  });

  test("410 is asked again without the expiration guard, so the expired slot can be shown", async () => {
    const urls: string[] = [];
    const record = await fetchHandle("mempoolxch", (url) => {
      urls.push(url);
      return urls.length === 1
        ? respond(410, { code: "handle_expired" })
        : respond(200, liveHandle);
    });
    expect(urls[1]).toBe(
      "https://api.xchandles.com/handle/mempoolxch?bypass_expiration_safety_check=true"
    );
    expect(record.status).toBe("expired");
    expect(record.ownerLauncherId).toBe(
      "551fc5bfe0f30ed7ea6f22d89221ac9c1f5fe053f62282bf8257c5bb6ed48db2"
    );
  });

  test("an expired handle the registry will not detail is still reported as expired", async () => {
    const record = await fetchHandle("mempoolxch", () => respond(410, { code: "handle_expired" }));
    expect(record.status).toBe("expired");
    expect(record.expiration).toBeNull();
  });

  test("404 and 400 mean the handle is free, 503 that the index is behind", async () => {
    expect((await fetchHandle("nobodyhasthis", () => respond(404))).status).toBe("unknown");
    expect((await fetchHandle("nobodyhasthis", () => respond(400))).status).toBe("unknown");
    expect((await fetchHandle("nobodyhasthis", () => respond(503))).status).toBe("syncing");
  });

  test("the @ is stripped before the registry is asked, which keys on the bare name", async () => {
    const urls: string[] = [];
    const record = await fetchHandle("@MaximEdogawa", (url) => {
      urls.push(url);
      return respond(200, liveHandle);
    });
    expect(urls).toEqual(["https://api.xchandles.com/handle/maximedogawa"]);
    expect(record.handle).toBe("maximedogawa");
  });

  test("a handle the registry cannot issue is never asked for", async () => {
    let asked = false;
    const record = await fetchHandle("yakuhito.xch", () => {
      asked = true;
      return respond(200, liveHandle);
    });
    expect(asked).toBe(false);
    expect(record.status).toBe("unknown");
  });

  test("a dead network is a state, not a throw", async () => {
    const record = await fetchHandle("mempoolxch", () => Promise.reject(new Error("offline")));
    expect(record.status).toBe("unavailable");
    expect(record.p2PuzzleHash).toBeNull();
  });
});

describe("fetchHandleRegistration", () => {
  test("reads the last confirmed action", async () => {
    const registration = await fetchHandleRegistration("mempoolxch", () =>
      respond(200, { action_kind: "register", protocol_fee: 10000, confirmation_height: 9318814 })
    );
    expect(registration).toEqual({
      actionKind: "register",
      protocolFee: 10000,
      confirmationHeight: 9318814,
    });
  });

  test("a miss, a body with no action and a failed fetch all give null", async () => {
    expect(await fetchHandleRegistration("mempoolxch", () => respond(404))).toBeNull();
    expect(await fetchHandleRegistration("mempoolxch", () => respond(200, {}))).toBeNull();
    expect(
      await fetchHandleRegistration("mempoolxch", () => Promise.reject(new Error("offline")))
    ).toBeNull();
  });
});
