import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against a production build with Coinset mocked by route interception (tests/e2e).
 * `LIVE=1 bun run test:live` runs the @live smoke tests against the real Coinset instead.
 */
const PORT = Number(process.env.E2E_PORT ?? 3210);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  // Playwright's 5 s default is too tight for a client-side navigation on a loaded runner: the
  // App Router only updates the URL once it has fetched the destination's payload, so a
  // toHaveURL after a nav click waits on a round trip, not just on rendering.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `PORT=${PORT} bun run start`,
    url: `http://localhost:${PORT}/up`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
