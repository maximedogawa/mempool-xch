import { expect, test, type Page } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

/**
 * The dashboard block row (src/widgets/blocks/BlocksRow.tsx, TASK-107): it opens centred on the
 * inflection point, snaps with proximity except while the mouse drags it, fades the edges that
 * have more blocks behind them, and "Now" brings the inflection point back to the middle.
 */

/** Horizontal centre of an element relative to the centre of the scroller. */
async function offCentre(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const row = document.querySelector<HTMLElement>("[data-testid='blocks-scroller']")!;
    const el = document.querySelector<HTMLElement>(sel)!;
    const a = row.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return b.left + b.width / 2 - (a.left + a.width / 2);
  }, selector);
}

async function ready(page: Page) {
  await page.goto("/");
  const recent = page.getByRole("list", { name: "Recent transaction blocks" });
  await expect(recent.getByRole("listitem").first()).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByRole("list", { name: "Projected next blocks" }).getByRole("listitem").first()
  ).toBeVisible();
  return page.getByTestId("blocks-scroller");
}

test.describe("block row", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("opens with now centred: the inflection point on desktop, the next block on a phone", async ({
    page,
    isMobile,
  }) => {
    await ready(page);
    // The leading space lets it reach the middle even with few projected blocks.
    const focus = isMobile ? ".blocks-queue li" : ".blocks-inflection";
    await expect.poll(async () => Math.abs(await offCentre(page, focus))).toBeLessThan(24);
  });

  test("snapping is proximity, and off only while the mouse drags", async ({ page, isMobile }) => {
    test.skip(isMobile, "mouse drag");
    const row = await ready(page);
    expect(await row.evaluate((el) => getComputedStyle(el).scrollSnapType)).toMatch(
      /^x( proximity)?$/
    );
    const box = (await row.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 120, box.y + 60, { steps: 6 });
    await expect(row).toHaveAttribute("data-dragging", "");
    expect(await row.evaluate((el) => getComputedStyle(el).scrollSnapType)).toBe("none");
    await page.mouse.up();
    await expect(row).not.toHaveAttribute("data-dragging", "");
    expect(await row.evaluate((el) => getComputedStyle(el).scrollSnapType)).toMatch(
      /^x( proximity)?$/
    );
  });

  test("edges fade while blocks lie beyond them, and Now centres the inflection point", async ({
    page,
  }) => {
    // Narrow enough that scrolling to the end takes the inflection point out of view.
    await page.setViewportSize({ width: 700, height: 900 });
    const row = await ready(page);
    await row.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: "instant" }));
    await expect(row).toHaveAttribute("data-fade-before", "");
    await expect(row).not.toHaveAttribute("data-fade-after", "");
    const back = page.getByTestId("blocks-back-to-now");
    await expect(back).toBeVisible();
    await back.click();
    await expect
      .poll(async () => Math.abs(await offCentre(page, ".blocks-inflection")))
      .toBeLessThan(24);
    await expect(back).toBeHidden();

    // The Now label on the inflection point does the same from anywhere.
    await row.evaluate((el) => el.scrollTo({ left: 0, behavior: "instant" }));
    await page.getByTestId("blocks-now").click();
    await expect
      .poll(async () => Math.abs(await offCentre(page, ".blocks-inflection")))
      .toBeLessThan(24);
  });

  test("on a phone, Now centres the next block", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const row = await ready(page);
    await row.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: "instant" }));
    const back = page.getByTestId("blocks-back-to-now");
    await expect(back).toBeVisible();
    await back.click();
    await expect
      .poll(async () => Math.abs(await offCentre(page, ".blocks-queue li")))
      .toBeLessThan(24);
    await expect(back).toBeHidden();
  });
});
