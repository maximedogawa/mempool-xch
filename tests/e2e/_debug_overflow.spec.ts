import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

const ROUTES = ["/blocks"];

test("debug overflow", async ({ page }) => {
  await mockCoinset(page);
  for (const width of [412, 400, 390, 380, 375, 360, 350, 340, 320]) {
    await page.setViewportSize({ width, height: 800 });
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(width, route, "overflow", overflow);
      if (overflow > 1) {
        const culprits = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const all = document.querySelectorAll("body *");
          const res: unknown[] = [];
          for (const el of all) {
            const r = el.getBoundingClientRect();
            if (r.right > vw + 0.5) {
              res.push({ tag: el.tagName, cls: (el as HTMLElement).className?.toString().slice(0, 150), right: r.right, width: r.width, text: el.textContent?.slice(0, 60) });
            }
          }
          return res.slice(0, 20);
        });
        console.log(JSON.stringify(culprits, null, 2));
      }
    }
  }
  expect(true).toBe(true);
});
