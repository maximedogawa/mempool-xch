import { describe, expect, test } from "bun:test";
import { describeChannel } from "./channel";

const base = {
  rpcUrl: "https://api.coinset.org",
  wsUrl: "wss://api.coinset.org/ws",
  isCoinset: true,
} as const;

describe("describeChannel", () => {
  test("on the direct Coinset socket", () => {
    const d = describeChannel({ ...base, status: "live", transport: "websocket" });
    expect(d.name).toBe("Coinset socket");
    expect(d.detail).toContain("api.coinset.org");
  });
  test("polling and custom node", () => {
    expect(describeChannel({ ...base, status: "polling", transport: "polling" }).name).toBe(
      "Polling"
    );
    const custom = describeChannel({
      ...base,
      rpcUrl: "https://node.example.test:8556",
      isCoinset: false,
      wsUrl: null,
      status: "polling",
      transport: "polling",
    });
    expect(custom.name).toBe("Polling (custom node)");
    expect(custom.detail).toContain("node.example.test:8556");
  });
  test("offline", () => {
    expect(describeChannel({ ...base, status: "offline", transport: "websocket" }).name).toBe(
      "Offline"
    );
  });
});

describe("describeChannel for nodexch", () => {
  const nodexch = {
    rpcUrl: "https://nodexch.space",
    wsUrl: "wss://nodexch.space/ws?key=nxp_abc",
    isCoinset: false,
    provider: "nodexch",
  } as const;
  test("a nodexch socket, not polling a custom node", () => {
    const live = describeChannel({ ...nodexch, status: "live", transport: "websocket" });
    expect(live.name).toBe("nodexch socket");
    expect(live.detail).toContain("nodexch.space");
    expect(live.detail).not.toContain("nxp_abc");
    expect(describeChannel({ ...nodexch, status: "connecting", transport: "websocket" }).name).toBe(
      "nodexch socket (reconnecting)"
    );
  });
});
