import { describe, expect, test } from "bun:test";
import { describeChannel } from "./channel";

const base = { rpcUrl: "https://api.coinset.org", eventsUrl: "/api/mainnet/events", wsUrl: "wss://api.coinset.org/ws", isCoinset: true } as const;

describe("describeChannel", () => {
  test("hosted tab on server events", () => {
    const d = describeChannel({ ...base, status: "live", transport: "sse", serverChannel: "websocket" });
    expect(d.name).toBe("Server events");
    expect(d.detail).toContain("one Coinset WebSocket");
  });
  test("server polling Coinset is named", () => {
    expect(describeChannel({ ...base, status: "live", transport: "sse", serverChannel: "polling" }).detail).toContain("polling Coinset");
  });
  test("snapshot on the direct socket", () => {
    expect(describeChannel({ ...base, eventsUrl: null, status: "live", transport: "websocket" }).name).toBe("Coinset socket");
  });
  test("polling and custom node", () => {
    expect(describeChannel({ ...base, status: "polling", transport: "polling" }).name).toBe("Polling");
    const custom = describeChannel({ ...base, rpcUrl: "https://node.example.test:8556", isCoinset: false, eventsUrl: null, wsUrl: null, status: "polling", transport: "polling" });
    expect(custom.name).toBe("Polling (custom node)");
    expect(custom.detail).toContain("node.example.test:8556");
  });
  test("offline", () => {
    expect(describeChannel({ ...base, status: "offline", transport: "sse" }).name).toBe("Offline");
  });
});
