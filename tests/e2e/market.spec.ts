import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

const gate = { bids: [["1.52", "20"]], asks: [["1.54", "12"]] };
const okx = {
  code: "0",
  data: [{ bids: [["1.51", "4", "0", "1"]], asks: [["1.55", "5", "0", "1"]] }],
};
const htx = { status: "ok", tick: { bids: [[1.5, 2]], asks: [[1.56, 2]] } };
const dex = (price: number) => ({ success: true, offers: [{ price }] });

async function mockMarket(page: import("@playwright/test").Page) {
  await page.route("https://api.gateio.ws/**", (route) => route.fulfill({ json: gate }));
  await page.route("https://www.okx.com/**", (route) => route.fulfill({ json: okx }));
  await page.route("https://api.huobi.pro/**", (route) => route.fulfill({ json: htx }));
  await page.route("https://api.dexie.space/**", async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({ json: dex(url.searchParams.get("offered") === "xch" ? 1.54 : 1.52) });
  });
}

test.describe("market", () => {
  test("shows the battlefield books, best cross exchange prices and Dexie", async ({ page }) => {
    await mockMarket(page);
    await mockCoinset(page);
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1, name: "Market" })).toBeVisible();
    await expect(page.getByText("Gate").first()).toBeVisible();
    await expect(page.getByText("OKX").first()).toBeVisible();
    await expect(page.getByText("HTX").first()).toBeVisible();
    await expect(page.getByText("1.5200 USDT").first()).toBeVisible();
    await expect(page.getByText("Dexie DEX · XCH / BYC")).toBeVisible();
    await expect(page.getByRole("button", { name: "ByteCash (BYC)" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByRole("link", { name: "Dexie pair" })).toHaveAttribute(
      "href",
      "https://dexie.space/offers/XCH/BYC"
    );
    await page.getByRole("button", { name: "wUSDC.b" }).click();
    await expect(page.getByText("Dexie DEX · XCH / wUSDC.b")).toBeVisible();
    await page.getByRole("button", { name: "USDC", exact: true }).click();
    await expect(page.getByText("USDC", { exact: true }).first()).toBeVisible();
  });

  test("marks a failed exchange stale and excludes it from the aggregate", async ({ page }) => {
    await mockCoinset(page);
    await page
      .route("https://api.gateio.ws/**", (route) => route.abort("failed"))
      .catch(() => undefined);
    await page.route("https://www.okx.com/**", (route) => route.fulfill({ json: okx }));
    await page.route("https://api.huobi.pro/**", (route) => route.fulfill({ json: htx }));
    await page.route("https://api.dexie.space/**", (route) => route.fulfill({ json: dex(1.54) }));
    await page.goto("/market");
    await expect(page.getByText("Source unavailable").first()).toBeVisible();
    await expect(page.getByText("1.5100 USDT").first()).toBeVisible();
  });
});
