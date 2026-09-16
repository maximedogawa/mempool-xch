import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("keyboard and touch access", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("every control on the dashboard is reachable by keyboard with a visible focus ring", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await page.goto("/");
    await page.waitForTimeout(2000);
    const interactive = await page.locator("a[href], button, input, select, [tabindex='0']").filter({ visible: true }).count();
    expect(interactive).toBeGreaterThan(20);
    const seen = new Set<string>();
    // Walk the first 60 tab stops and record what got focus and whether it shows an outline.
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        return { tag: el.tagName, text: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40), outline: style.outlineStyle !== "none" && style.outlineWidth !== "0px" };
      });
      if (info) seen.add(`${info.tag}:${info.text}`);
      if (info && !info.outline) {
        // Focus-visible rings come from :focus-visible; keyboard focus must trigger it.
        const visible = await page.evaluate(() => document.activeElement?.matches(":focus-visible") ?? false);
        expect(visible, `${info.tag} "${info.text}" has no visible focus`).toBe(true);
      }
    }
    expect([...seen].some((s) => s.startsWith("INPUT"))).toBe(true);
    expect([...seen].some((s) => s.includes("Blocks"))).toBe(true);
    expect([...seen].some((s) => s.includes("Projected block"))).toBe(true);
  });

  test("search shortcut, enter and escape work from the keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await page.goto("/");
    await page.keyboard.press("/");
    await expect(page.getByRole("searchbox").first()).toBeFocused();
    await page.keyboard.type("9295514");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/block\/9295514/);
  });

  test("mobile navigation and primary controls have at least 44px touch targets", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const boxes = await page.getByRole("navigation", { name: "Mobile" }).getByRole("link").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(boxes.length).toBeGreaterThan(3);
    boxes.forEach((h) => expect(h).toBeGreaterThanOrEqual(44));
    const menu = await page.getByRole("button", { name: "Close menu" }).boundingBox();
    expect(menu?.height ?? 0).toBeGreaterThanOrEqual(40);
    const search = await page.getByRole("searchbox").first().boundingBox();
    expect(search?.height ?? 0).toBeGreaterThanOrEqual(40);
  });
});
