import { describe, expect, test } from "bun:test";
import { createRpcClient } from "./client";

describe("rpc client headers", () => {
  test("sends configured headers (bearer key) on full-node and indexed calls", async () => {
    const seen: Record<string, string>[] = [];
    const fetchImpl = (async (_input: string | URL | Request, init?: RequestInit) => {
      seen.push({ ...(init?.headers as Record<string, string>) });
      return new Response(JSON.stringify({ success: true, blockchain_state: { peak: { height: 1, header_hash: "0x00", is_transaction_block: true }, mempool_min_fees: {} }, transactions: [] }), { status: 200 });
    }) as typeof fetch;
    const client = createRpcClient({ rpcUrl: "https://api.coinset.org", indexedUrl: "https://api.coinset.org", fetchImpl, headers: { authorization: "Bearer cs_key" } });
    await client.getBlockchainState();
    await client.getBlockTransactions(1);
    expect(seen).toHaveLength(2);
    seen.forEach((h) => {
      expect(h.authorization).toBe("Bearer cs_key");
      expect(h["content-type"]).toBe("application/json");
    });
  });
});
