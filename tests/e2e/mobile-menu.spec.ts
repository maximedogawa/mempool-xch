import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

// A short phone: the open menu is taller than the screen, so its end must be reachable by
// scrolling the menu itself (it hangs off the sticky header, which never scrolls with the page).
test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });

test("the open mobile menu scrolls to its last entries", async ({ page }) => {
  await mockCoinset(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();

  const last = nav.getByRole("link", { name: "Settings" });
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport({ ratio: 1 });
  const box = await nav.boundingBox();
  expect(box && box.y + box.height).toBeLessThanOrEqual(667);

  // The page behind is locked while the menu is open, and released when it closes.
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).overflow))
    .toBe("hidden");
  await last.click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(nav).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});
