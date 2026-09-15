import { expect, test } from "@playwright/test";
import { mockCoinset, TX_ID } from "./mockCoinset";

test.describe("dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("renders projected and confirmed blocks, fees and feeds from fixtures", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Mempool\.xch/);
    await expect(page.getByRole("list", { name: "Projected next blocks" }).getByRole("listitem").first()).toBeVisible();
    await expect(page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()).toBeVisible();
    await expect(page.getByText("9,295,514", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Transaction fees")).toBeVisible();
    await expect(page.getByText("Next block", { exact: true })).toBeVisible();
    await expect(page.getByText("Latest transactions")).toBeVisible();
    await expect(page.getByText("Latest blocks")).toBeVisible();
    // Connection indicator falls back to polling because the WebSocket is closed by the mock.
    await expect(page.getByRole("status").filter({ hasText: /Polling|Live|Connecting/ }).first()).toBeVisible();
  });

  test("opens a projected block drill-down", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("list", { name: "Projected next blocks" }).getByRole("button").first().click();
    await expect(page.getByText(/Projected block 1 ·/)).toBeVisible();
    await expect(page.getByRole("link", { name: /…/ }).first()).toBeVisible();
  });

  test("search routes by shape and reports invalid input", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("searchbox").first();
    await search.fill("not a valid id");
    await search.press("Enter");
    await expect(page.getByRole("alert")).toContainText("Not recognised");
    await search.fill("9295514");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/block\/9295514/);
  });

  test("search resolves an ambiguous 32-byte hex id by probing", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("searchbox").first();
    await search.fill(TX_ID);
    await search.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/tx/${TX_ID}`));
  });

  test("health route answers", async ({ request }) => {
    const res = await request.get("/up");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "up" });
  });
});
