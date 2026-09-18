import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";
import { mockMintGarden, mockDexieOffers } from "./mockMintGarden";

/**
 * Production security headers. Only meaningful against a production build
 * (next.config.ts's headers() returns [] outside NODE_ENV=production), which is what
 * BASE_URL points e2e at in CI/this repo's verification flow, not `bun dev`.
 */
test.describe("security headers", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockMintGarden(page);
    await mockDexieOffers(page);
  });

  test("the dashboard response carries CSP, Referrer-Policy, X-Content-Type-Options and Permissions-Policy", async ({
    page,
  }) => {
    const response = await page.goto("/");
    const headers = response!.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain("connect-src 'self' https: wss:");
    expect(headers["content-security-policy"]).toContain("https://icons.dexie.space");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["permissions-policy"]).toContain("geolocation=()");
  });

  test("no CSP violations while navigating the dashboard, an NFT page and the pools page", async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && /content security policy/i.test(msg.text()))
        violations.push(msg.text());
    });
    await page.goto("/");
    await expect(page.getByText("Transaction fees")).toBeVisible();
    await page.goto("/nfts");
    await expect(page.getByRole("heading", { level: 1, name: "NFTs" })).toBeVisible();
    await page.goto("/pools");
    await expect(page.getByRole("heading", { level: 1, name: "Pools" })).toBeVisible();
    expect(violations).toEqual([]);
  });
});
