import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";
import { mockXchandles, FREE_HANDLE, HANDLE } from "./mockXchandles";

/**
 * XCHandles name lookup: the registry at api.xchandles.com is the authority for the resolution,
 * so the page is exercised against mocks of the shapes it answers live.
 */
test.describe("handles", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockXchandles(page);
  });

  test("a registered handle shows what it resolves to, its term and its registration", async ({
    page,
  }) => {
    await page.goto(`/handle/${HANDLE}`);
    await expect(page.getByText("Registered", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /^xch1/ }).first()).toBeVisible();
    await expect(page.getByText("in 1 year")).toBeVisible();
    await expect(page.getByRole("link", { name: /Block 9,318,814/ })).toBeVisible();
  });

  test("a name nobody has registered says so instead of failing", async ({ page }) => {
    await page.goto(`/handle/${FREE_HANDLE}`);
    await expect(page.getByText("Not registered", { exact: true })).toBeVisible();
    await expect(page.getByText(`${FREE_HANDLE} is not registered`)).toBeVisible();
  });

  test("a string the registry cannot issue is rejected before it is asked for", async ({
    page,
  }) => {
    await page.goto("/handle/not.a.handle");
    await expect(page.getByText("Not a valid handle")).toBeVisible();
  });

  test("the Watch button adds the handle and the dashboard row resolves it", async ({ page }) => {
    await page.goto(`/handle/${HANDLE}`);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(page.getByRole("button", { name: "Watching" })).toBeVisible();

    await page.goto("/");
    const panel = page.getByRole("region", { name: "Watchlist" });
    await expect(panel.getByRole("link", { name: HANDLE })).toBeVisible();
    await expect(panel.getByText("Resolves to")).toBeVisible();
  });
});
