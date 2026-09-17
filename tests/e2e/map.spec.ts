import { expect, test } from "@playwright/test";
import { mockCoinset, mockCustomNode } from "./mockCoinset";

test.describe("network map", () => {
  test("explains the limitation on Coinset", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network" })).toBeVisible();
    await expect(page.getByText("Not available on Coinset")).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings → Full-node RPC endpoint" })).toBeVisible();
  });

  test("lists connected peers with a custom node", async ({ page }) => {
    await mockCustomNode(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network" })).toBeVisible();
    const table = page.getByRole("region", { name: "Connections" });
    await expect(table.getByText("203.0.113.10:8444")).toBeVisible();
    await expect(table.getByText("Wallet")).toBeVisible();
    await expect(page.getByText("Full node").first()).toBeVisible();
  });
});
