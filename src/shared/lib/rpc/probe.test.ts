import { describe, expect, test } from "bun:test";
import { RpcError } from "./errors";
import { probeIndexed } from "./probe";

const answering = { getXchBalanceByP2: async () => ({ confirmed: 0 }) };
const failing = (error: unknown) => ({
  getXchBalanceByP2: async () => {
    throw error;
  },
});

describe("probeIndexed", () => {
  test("an answer means the index is on", async () => {
    expect(await probeIndexed(answering)).toBe(true);
  });

  test("501 or 'index not enabled' means it is off", async () => {
    expect(
      await probeIndexed(
        failing(new RpcError("http", "get_xch_balance_by_p2", "HTTP 501", { status: 501 }))
      )
    ).toBe(false);
    expect(
      await probeIndexed(
        failing(
          new RpcError("rpc", "get_xch_balance_by_p2", "index not enabled", {
            detail: '{"success":false}',
          })
        )
      )
    ).toBe(false);
  });

  test("a network error or another refusal says nothing about the index", async () => {
    expect(
      await probeIndexed(failing(new RpcError("network", "get_xch_balance_by_p2", "Network error")))
    ).toBe(true);
    expect(
      await probeIndexed(
        failing(new RpcError("http", "get_xch_balance_by_p2", "HTTP 429", { status: 429 }))
      )
    ).toBe(true);
    expect(await probeIndexed(failing(new Error("boom")))).toBe(true);
  });
});
