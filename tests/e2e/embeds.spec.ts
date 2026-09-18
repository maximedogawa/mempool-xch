import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { mockCoinset, TX_ID } from "./mockCoinset";

test.describe("embeds and badges", () => {
  test("mempool embed renders from Coinset and honours the theme parameter", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/embed/mempool.html?theme=light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("#count")).toHaveText("74");
    await expect(page.locator("#foot")).toContainText("Peak #9,295,519");
    await page.goto("/embed/mempool.html");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("fees and blocks embeds show live numbers; tx embed reports a confirmed transaction", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/embed/fees.html");
    await expect(page.locator("#f60")).not.toHaveText("…");
    await page.goto("/embed/blocks.html");
    await expect(page.locator("#blocks .block.projected").first()).toBeVisible();
    await expect(page.locator("#blocks .block:not(.projected)").first()).toContainText("#9,295,5");
    await page.goto(`/embed/tx.html?id=${TX_ID}`);
    await expect(page.locator("#pill")).toHaveText("Confirmed");
    await expect(page.locator("#detail")).toContainText("block #9,295,514");
    await page.goto("/embed/tx.html?id=nope");
    await expect(page.locator("#pill")).toHaveText("No transaction id");
  });

  test("embeds may be framed by any origin; the app itself may not", async ({ request }) => {
    const embed = await request.get("/embed/mempool.html");
    expect(embed.headers()["content-security-policy"]).toContain("frame-ancestors *");
    const app = await request.get("/fees");
    expect(app.headers()["content-security-policy"]).toContain("frame-ancestors 'self'");
  });

  test("badge route answers SVG; an invalid id needs no upstream call", async ({ request }) => {
    const res = await request.get("/api/badge/tx/not-a-tx-id.svg");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/svg+xml");
    const body = await res.text();
    expect(body).toContain("<svg");
    expect(body).toContain("invalid");
  });

  test("every embed stays far under 100 KB of script", () => {
    const dir = join(process.cwd(), "public", "embed");
    const scripts = readdirSync(dir).filter((f) => f.endsWith(".js"));
    const shared = statSync(join(dir, "common.js")).size;
    for (const f of scripts.filter((s) => s !== "common.js")) expect(statSync(join(dir, f)).size + shared, f).toBeLessThan(100 * 1024);
  });

  test("the API page documents the embeds with copy-paste snippets", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/api");
    await expect(page.getByRole("heading", { name: "Embeds and badges" })).toBeVisible();
    await expect(page.getByTestId("embed-snippet-mempool")).toContainText('<iframe src="https://mempoolxch.space/embed/mempool.html?theme=dark"');
    await page.getByRole("group", { name: "Embed theme" }).getByRole("button", { name: "light" }).click();
    await expect(page.getByTestId("embed-snippet-mempool")).toContainText("theme=light");
    await expect(page.getByTestId("embed-snippet-badge")).toContainText("/api/badge/tx/<tx id>.svg");
  });
});
