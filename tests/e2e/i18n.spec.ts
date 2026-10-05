import { expect, test, type Page } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

const SETTINGS_KEY = "mempool-xch:settings:v1";

/** The switch sits in the header on wide screens and in the menu on phones. */
async function languageSwitch(page: Page) {
  const header = page.locator("header").getByTestId("language-switch");
  if (await header.first().isVisible()) return header.first();
  await page.getByRole("button", { name: "Open menu" }).click();
  return page.getByRole("navigation", { name: "Mobile" }).getByTestId("language-switch");
}

/** UI language: the header switch applies without a reload, persists, and "auto" follows the browser. */
test.describe("i18n", () => {
  test("switching to German translates the app without a reload and persists", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/");
    await expect(page.getByText("9,295,514", { exact: true }).first()).toBeVisible();
    // A marker that only survives if the page is not reloaded.
    await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));

    await (await languageSwitch(page)).selectOption("de");

    await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
    await expect(page.getByText("9.295.514", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Transaktionsgebühren").first()).toBeVisible();
    expect(
      await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)
    ).toBe(true);
    const stored = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) ?? "null"),
      SETTINGS_KEY
    );
    expect(stored).toMatchObject({ locale: "de" });

    await page.goto("/legal/terms");
    await expect(
      page.getByRole("heading", { level: 1, name: "Nutzungsbedingungen" })
    ).toBeVisible();
    await expect(page.getByText("Bei Abweichungen gilt die englische Fassung.")).toBeVisible();
    await expect(page.getByTestId("footer-disclaimer")).toContainText(
      "keine Finanz-, Anlage-, Steuer- oder Rechtsberatung"
    );
  });

  test.describe("browser language", () => {
    test.use({ locale: "es-ES" });
    test("auto follows a supported browser language", async ({ page }) => {
      await mockCoinset(page);
      await page.goto("/blocks");
      await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
      await expect(page.getByRole("heading", { name: /^Bloques/ }).first()).toBeVisible();
    });
  });
});
