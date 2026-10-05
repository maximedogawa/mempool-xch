// Preloaded by bun test (bunfig.toml). Keeps unit tests deterministic: no wall-clock
// surprises and no accidental network access from the RPC client.
import { afterEach, beforeEach } from "bun:test";

import { runtimeConfigScript } from "@/shared/config/runtime";

// A site with its nodexch key, so the defaults are those of production: what the server's
// /runtime-config.js does in a browser, before any module reads it.
new Function(
  runtimeConfigScript({ nodexchKeys: { mainnet: "nxp_unitTestKey0123456789abcdef" } })
)();

const realFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    throw new Error(`Unexpected network call in unit test: ${String(input)}`);
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});
