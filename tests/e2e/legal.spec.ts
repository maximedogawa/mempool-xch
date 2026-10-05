import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

const CONSENT_KEY = "mempool-xch:consent:v1";

/** Legal pages, footer disclaimer and the consent panel. */
test.describe("legal", () => {
  test("footer carries the disclaimer and links every legal page", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/blocks");
    await expect(page.getByTestId("footer-disclaimer")).toContainText(
      "not financial, investment, tax or legal advice"
    );
    await expect(page.getByTestId("footer-disclaimer")).toContainText(
      "not affiliated with or endorsed by Chia Network Inc."
    );
    const legal = page.getByRole("navigation", { name: "Legal", exact: true });
    for (const [name, heading, path] of [
      ["Terms of use", "Terms of use", "/legal/terms"],
      ["Legal notice", "Legal notice", "/legal/notice"],
      ["Privacy policy", "Privacy policy", "/legal/privacy"],
      ["Cookie policy", "Cookie policy", "/legal/cookies"],
    ] as const) {
      await legal.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });

  test("first visit asks; Reject all is stored for 12 months and Cookie settings reopens the panel", async ({
    page,
  }) => {
    await mockCoinset(page, { consent: false });
    await page.goto("/");
    const panel = page.getByRole("region", { name: "Cookies and local storage" });
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("checkbox", { name: /Strictly necessary/ })).toBeChecked();
    await expect(panel.getByRole("checkbox", { name: /Strictly necessary/ })).toBeDisabled();
    await expect(panel.getByRole("checkbox", { name: /Analytics/ })).not.toBeChecked();
    await panel.getByRole("button", { name: "Reject all" }).click();
    await expect(panel).toBeHidden();
    const stored = await page.evaluate(
      (key) => JSON.parse(window.localStorage.getItem(key) ?? "null"),
      CONSENT_KEY
    );
    expect(stored).toMatchObject({ analytics: false, advertising: false });
    await page.reload();
    await expect(
      page
        .getByRole("heading", { level: 1 })
        .or(page.getByRole("list", { name: "Recent transaction blocks" }))
        .first()
    ).toBeVisible();
    await expect(panel).toBeHidden();

    await page
      .getByRole("navigation", { name: "Legal", exact: true })
      .getByRole("button", { name: "Cookie settings" })
      .click();
    await expect(panel).toBeVisible();
    await panel.getByRole("checkbox", { name: /Analytics/ }).check();
    await panel.getByRole("button", { name: "Save my choice" }).click();
    await expect(panel).toBeHidden();
    expect(
      await page.evaluate(
        (key) => JSON.parse(window.localStorage.getItem(key) ?? "null"),
        CONSENT_KEY
      )
    ).toMatchObject({ analytics: true, advertising: false });
  });

  test("Global Privacy Control counts as refusal: no banner, optional categories locked off", async ({
    page,
  }) => {
    await mockCoinset(page, { consent: false });
    await page.addInitScript(() => {
      Object.defineProperty(Navigator.prototype, "globalPrivacyControl", {
        get: () => true,
        configurable: true,
      });
    });
    await page.goto("/legal/cookies");
    const panel = page.getByRole("region", { name: "Cookies and local storage" });
    await expect(page.getByRole("heading", { level: 1, name: "Cookie policy" })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(panel).toBeHidden();
    await page.getByRole("main").getByRole("button", { name: "Cookie settings" }).click();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Global Privacy Control");
    await expect(panel.getByRole("checkbox", { name: /Analytics/ })).toBeDisabled();
    await expect(panel.getByRole("button", { name: "Accept all" })).toBeDisabled();
  });

  test("consent panel passes axe", async ({ page }) => {
    await mockCoinset(page, { consent: false });
    await page.goto("/legal/privacy");
    await expect(page.getByRole("region", { name: "Cookies and local storage" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join("\n")
    ).toEqual([]);
  });
});
