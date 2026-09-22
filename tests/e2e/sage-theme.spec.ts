import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";
import { installFakeSage } from "./fakeSage";

const theme = (page: import("@playwright/test").Page) =>
  page.evaluate(() => document.documentElement.dataset.theme);

test.describe("theme inside Sage", () => {
  test("follows Sage's light theme over the app's own setting and the system scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await mockCoinset(page);
    await installFakeSage(page, [], undefined, { name: "xch-light", mostLike: "light" });
    await page.goto("/");
    await expect.poll(() => theme(page)).toBe("light");
  });

  test("switches live when Sage's theme changes", async ({ page }) => {
    await mockCoinset(page);
    await installFakeSage(page, [], undefined, { name: "xch-dark", mostLike: "dark" });
    await page.goto("/");
    await expect.poll(() => theme(page)).toBe("dark");
    await page.evaluate(() =>
      (
        window as unknown as { __FAKE_SAGE_SET_THEME__: (t: unknown) => void }
      ).__FAKE_SAGE_SET_THEME__({ name: "glass-light", mostLike: "light" })
    );
    await expect.poll(() => theme(page)).toBe("light");
    await page.evaluate(() =>
      (
        window as unknown as { __FAKE_SAGE_SET_THEME__: (t: unknown) => void }
      ).__FAKE_SAGE_SET_THEME__({ name: "circuit", mostLike: "dark" })
    );
    await expect.poll(() => theme(page)).toBe("dark");
  });
});

test.describe("Sage's theme variables", () => {
  for (const sage of [
    { name: "xch-dark", mostLike: "dark", primary: "#5ece7b" },
    { name: "xch-light", mostLike: "light", primary: "#2f9a4d" },
  ]) {
    test(`do not replace the app's own colours (${sage.mostLike})`, async ({ page }) => {
      await mockCoinset(page);
      await installFakeSage(page, [], undefined, sage);
      await page.goto("/");
      await expect.poll(() => theme(page)).toBe(sage.mostLike);
      // The SDK mounts Sage's --primary/--accent/--border/--radius on :root; ours must win.
      await expect
        .poll(() => page.evaluate(() => !!document.getElementById("sage-environment-theme-vars")))
        .toBe(true);
      const token = (name: string) =>
        page.evaluate(
          (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
          name
        );
      expect(await token("--primary")).toBe(sage.primary);
      expect(await token("--radius")).toBe("10px");
    });
  }
});
