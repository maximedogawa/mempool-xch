import { describe, expect, test } from "bun:test";
import { corsHeaders, decide, isAllowedOrigin, methodOf } from "./proxyCore";

describe("dev proxy request handling", () => {
  test("only localhost pages and the hosted site may call it", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:4173")).toBe(true);
    expect(isAllowedOrigin("https://mempoolxch.space")).toBe(true);
    expect(isAllowedOrigin(null)).toBe(true);
    expect(isAllowedOrigin("http://mempoolxch.space")).toBe(false);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("https://mempoolxch.space.evil.example")).toBe(false);
    expect(isAllowedOrigin("not a url")).toBe(false);
  });

  test("forwards the app's read methods and push_tx, nothing else", () => {
    expect(methodOf("/get_blockchain_state")).toBe("get_blockchain_state");
    expect(methodOf("/push_tx")).toBe("push_tx");
    expect(methodOf("/stop_node")).toBeNull();
    expect(methodOf("/close_connection")).toBeNull();
    expect(methodOf("/get_transaction")).toBeNull(); // Coinset only
    expect(methodOf("/")).toBeNull();
  });

  test("decides before anything reaches the node", () => {
    const origin = "http://localhost:3001";
    expect(decide({ method: "OPTIONS", pathname: "/get_block", origin })).toEqual({
      kind: "preflight",
      status: 204,
    });
    expect(decide({ method: "POST", pathname: "/get_block", origin })).toEqual({
      kind: "forward",
      method: "get_block",
    });
    expect(decide({ method: "GET", pathname: "/get_block", origin }).kind).toBe("reject");
    expect(decide({ method: "POST", pathname: "/stop_node", origin })).toMatchObject({
      status: 404,
    });
    expect(
      decide({ method: "POST", pathname: "/get_block", origin: "https://evil.example" })
    ).toMatchObject({ status: 403 });
  });

  test("CORS headers echo an allowed origin and are absent otherwise", () => {
    expect(corsHeaders("http://localhost:3001")["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:3001"
    );
    expect(corsHeaders("https://evil.example")).toEqual({});
    expect(corsHeaders(null)).toEqual({});
  });
});
