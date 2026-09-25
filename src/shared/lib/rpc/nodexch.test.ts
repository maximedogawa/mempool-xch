import { describe, expect, test } from "bun:test";
import { createRpcClient, type FetchLike } from "./client";

const calls: { url: string; init?: RequestInit }[] = [];
const fetchImpl: FetchLike = async (input, init) => {
  const url = String(input);
  calls.push({ url, init });
  if (url.endsWith("/x/node/v1/peers")) {
    return new Response(
      JSON.stringify({
        connections: [
          {
            type: 1,
            peer_host: "203.0.113.0",
            peer_server_port: 8444,
            peak_height: 9000000,
            creation_time: 1700000000,
          },
        ],
        success: true,
      })
    );
  }
  return new Response('{"blockchain_state": {"peak": {"height": 7}}, "success": true}');
};

describe("a nodexch gateway", () => {
  const client = createRpcClient({
    rpcUrl: "https://nodexch.space",
    indexedUrl: "https://nodexch.space",
    nodexch: { apiKey: "nxp_Zk3vQ0aBq1v0m3J2o0r8c5Tt" },
    fetchImpl,
  });

  test("every call carries the publishable key", async () => {
    calls.length = 0;
    await client.getBlockchainState().catch(() => undefined);
    const headers = new Headers(calls[0]!.init!.headers);
    expect(headers.get("authorization")).toBe("Bearer nxp_Zk3vQ0aBq1v0m3J2o0r8c5Tt");
    expect(calls[0]!.url).toBe("https://nodexch.space/get_blockchain_state");
  });

  test("peers come from the node channel, with the listening port", async () => {
    calls.length = 0;
    const peers = await client.getConnections();
    expect(calls[0]!.url).toBe("https://nodexch.space/x/node/v1/peers");
    expect(new Headers(calls[0]!.init!.headers).get("authorization")).toContain("nxp_");
    expect(peers).toHaveLength(1);
    expect(peers[0]!.peerHost).toBe("203.0.113.0");
    expect(peers[0]!.peerPort).toBe(8444);
    expect(peers[0]!.peakHeight).toBe(9000000);
  });

  test("Coinset gets no key header", async () => {
    calls.length = 0;
    const coinset = createRpcClient({
      rpcUrl: "https://api.coinset.org",
      indexedUrl: null,
      fetchImpl,
    });
    await coinset.getBlockchainState().catch(() => undefined);
    expect(new Headers(calls[0]!.init!.headers).get("authorization")).toBeNull();
  });
});
