import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

/**
 * The header's More menu reaches every secondary section. One walk replaces the per-section
 * "reachable from the menu" tests; each section's own spec opens its page directly. The phone
 * menu is covered by mobile-menu.spec.ts and keyboard.spec.ts (both @phone).
 */
const MORE_MENU = [
  { name: "Tokens", url: /\/tokens$/ },
  { name: "Portfolio", url: /\/portfolio$/ },
  { name: "NFTs", url: /\/nfts$/ },
  { name: "Fees", url: /\/fees$/ },
  { name: "Pools", url: /\/pools$/ },
  { name: "Vaults", url: /\/vaults$/ },
  { name: "Learn", url: /\/learn$/ },
  { name: "Help", url: /\/docs$/ },
  { name: "Arcade", url: /\/gaming$/ },
];

test("every More menu entry opens its section", async ({ page }) => {
  await mockCoinset(page);
  await page.goto("/");
  for (const entry of MORE_MENU) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: entry.name, exact: true }).click();
    await expect(page, entry.name).toHaveURL(entry.url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
