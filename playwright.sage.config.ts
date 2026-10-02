import { defineConfig, devices } from "@playwright/test";

/**
 * E2E against the Sage static export (`bun run build:sage` first), served the way Sage serves
 * an installed app (scripts/sage/serve-snapshot.ts: manifest files only, the app CSP, no
 * rewrites). Only specs that are meant to hold in both builds run here; Coinset and the other
 * APIs are mocked by route interception exactly as in playwright.config.ts.
 *
 *   bun run build:sage && E2E_PORT=4174 bun run test:e2e:sage
 */
const PORT = Number(process.env.E2E_PORT ?? 4174);

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: ["goggles.spec.ts"],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "en-US",
  },
  projects: [
    { name: "sage-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "sage-mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `bun run scripts/sage/serve-snapshot.ts --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
