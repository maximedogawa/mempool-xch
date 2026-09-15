// Preloaded by bun test (bunfig.toml). Keeps unit tests deterministic: no wall-clock
// surprises and no accidental network access from the RPC client.
import { afterEach, beforeEach } from "bun:test";

const realFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    throw new Error(`Unexpected network call in unit test: ${String(input)}`);
  }) as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});
