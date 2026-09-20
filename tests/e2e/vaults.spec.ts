import { expect, test } from "@playwright/test";
import { mockCoinset, mockCustomNode, VAULT_ADDRESS, VAULT_LAUNCHER } from "./mockCoinset";

test.describe("vaults", () => {
  test("Vaults menu opens the prefarm vaults and the Chia Vaults lookup", async ({
    page,
    isMobile,
  }) => {
    await mockCoinset(page);
    if (isMobile) {
      // The primary navigation is collapsed on phones; the page itself is what matters here.
      await page.goto("/vaults");
    } else {
      await page.goto("/");
      // Vaults lives under the header's More menu, not the top bar.
      await page.getByRole("button", { name: "More", exact: true }).click();
      await page.getByRole("menuitem", { name: "Vaults" }).click();
      await expect(page).toHaveURL(/\/vaults$/);
    }
    await expect(page.getByRole("heading", { level: 1, name: "Prefarm tracker" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Chia Vaults" })).toBeVisible();

    const box = page.getByRole("textbox", { name: "Vault launcher id or address" });
    await box.fill(VAULT_LAUNCHER);
    await page.getByRole("button", { name: "Look up" }).click();
    const singleton = page.getByTestId("vault-singleton");
    await expect(singleton).toContainText("current coin unspent");
    await expect(singleton).toContainText("#8,969,947");
    await expect(singleton.getByRole("link", { name: "open on the scanner" })).toHaveAttribute(
      "href",
      `https://vaults.xchplorer.com/vault/${VAULT_LAUNCHER}`
    );

    await page.getByRole("button", { name: "Try an example" }).click();
    await expect(box).toHaveValue(VAULT_ADDRESS);
    await page.getByRole("button", { name: "Look up" }).click();
    const address = page.getByTestId("vault-address");
    await expect(address).toContainText("41,991 XCH");
    await expect(address).toContainText("Buy XCH hot wallet");

    await box.fill("xch1broken");
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByText(/checksum is wrong/)).toBeVisible();
    await expect(page.getByText(/No vault recovery seen/)).toBeVisible();
  });

  test("/prefarm still answers, and a custom node can only look vaults up by address", async ({
    page,
  }) => {
    await mockCustomNode(page);
    await page.goto("/prefarm");
    await expect(page.getByRole("heading", { level: 2, name: "Chia Vaults" })).toBeVisible();
    await page.getByRole("textbox", { name: "Vault launcher id or address" }).fill(VAULT_LAUNCHER);
    await page.getByRole("button", { name: "Look up" }).click();
    await expect(page.getByText(/need Coinset; with a custom node paste/)).toBeVisible();
  });
});
