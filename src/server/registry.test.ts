import { describe, expect, test } from "bun:test";
import { serverRpcHeaders } from "./registry";

describe("serverRpcHeaders", () => {
  test("adds the bearer token only when COINSET_API_KEY is set", () => {
    expect(serverRpcHeaders({})).toEqual({});
    expect(serverRpcHeaders({ COINSET_API_KEY: " cs_abc " })).toEqual({ authorization: "Bearer cs_abc" });
  });
});
