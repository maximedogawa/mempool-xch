// Preloaded by bun test (bunfig.toml). Keeps unit tests deterministic: no wall-clock
// surprises and no accidental network access from the RPC client.
import { afterEach, beforeEach } from "bun:test";

// A build with the site's nodexch key, so the defaults are those of production; set before any
// module reads it (src/shared/config/networks.ts).
process.env.NEXT_PUBLIC_NODEXCH_KEY_MAINNET = "nxp_unitTestKey0123456789abcdef";

const realFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    throw new Error(`Unexpected network call in unit test: ${String(input)}`);
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});
