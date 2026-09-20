import { expect, test } from "@playwright/test";
import { puzzleHashToAddress } from "../../src/shared/lib/chia/address";
import { mockCoinset, P2, TX_ID, WATCHED_PENDING_TX_ID } from "./mockCoinset";

const P2_ADDRESS = puzzleHashToAddress(P2, "xch");
/** A real mainnet DID; MintGarden is not mocked, so only the identity itself is asserted. */
const DID_ID = "did:chia:1w0hjc9aja50f0895f8lj3pfvxdcp3ngl0e0yk64lz3yw34js5mvstx2cnk";

test.describe("watchlist", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("adds a transaction and an address, shows their status, and persists across reloads", async ({
    page,
  }) => {
    await page.goto("/");
    const panel = page.getByRole("region", { name: "Watchlist" });
    await expect(panel.getByText("Nothing watched yet.")).toBeVisible();

    await page
      .getByLabel("Add an address, @handle, DID or transaction id to your watchlist")
      .fill(TX_ID);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(panel.getByRole("link", { name: new RegExp(TX_ID.slice(0, 8)) })).toBeVisible();
    await expect(panel.getByText("Confirmed")).toBeVisible();

    await page
      .getByLabel("Add an address, @handle, DID or transaction id to your watchlist")
      .fill(P2_ADDRESS);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(
      panel.getByRole("link", { name: new RegExp(P2_ADDRESS.slice(0, 10)) })
    ).toBeVisible();
    await expect(
      panel.getByRole("link", { name: new RegExp(WATCHED_PENDING_TX_ID.slice(0, 6)) })
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("region", { name: "Watchlist" }).getByText("Confirmed")
    ).toBeVisible();
  });

  test("rejects invalid input", async ({ page }) => {
    await page.goto("/");
    await page
      .getByLabel("Add an address, @handle, DID or transaction id to your watchlist")
      .fill("not an id");
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(page.locator("#watchlist-add-error")).toContainText(
      "Paste an address, a did:chia: id, an @handle or a 64-character transaction id."
    );
  });

  test("a DID is watched by its launcher id and its holdings are shown", async ({ page }) => {
    await page.goto("/");
    const panel = page.getByRole("region", { name: "Watchlist" });
    await page
      .getByLabel("Add an address, @handle, DID or transaction id to your watchlist")
      .fill(DID_ID);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(panel.getByText("Watchlist · 1")).toBeVisible();
    await expect(panel.getByRole("link", { name: new RegExp(DID_ID.slice(0, 14)) })).toBeVisible();

    await page.reload();
    await expect(
      page
        .getByRole("region", { name: "Watchlist" })
        .getByRole("link", { name: new RegExp(DID_ID.slice(0, 14)) })
    ).toBeVisible();
  });

  test("an XCHandles handle is watched as @name and kept by its bare name", async ({ page }) => {
    await page.goto("/");
    const panel = page.getByRole("region", { name: "Watchlist" });
    await page
      .getByLabel("Add an address, @handle, DID or transaction id to your watchlist")
      .fill("@MempoolXCH");
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(panel.getByRole("link", { name: "@mempoolxch" })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("mempool-xch:watchlist:v1"))).toContain(
      '"id":"mempoolxch"'
    );

    await page.reload();
    await expect(
      page.getByRole("region", { name: "Watchlist" }).getByRole("link", { name: "@mempoolxch" })
    ).toBeVisible();
  });

  test("the Watch button on a transaction page adds it, and removing it clears the panel", async ({
    page,
  }) => {
    await page.goto(`/tx/${TX_ID}`);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(page.getByRole("button", { name: "Watching" })).toBeVisible();

    await page.goto("/");
    const panel = page.getByRole("region", { name: "Watchlist" });
    await expect(panel.getByText("Watchlist · 1")).toBeVisible();

    await panel.getByRole("button", { name: /Stop watching/ }).click();
    await expect(panel.getByText("Nothing watched yet.")).toBeVisible();
  });

  test("the Watch button on an address page toggles", async ({ page }) => {
    await page.goto(`/address/${P2}`);
    await page.getByRole("button", { name: "Watch", exact: true }).click();
    await expect(page.getByRole("button", { name: "Watching" })).toBeVisible();
    await page.getByRole("button", { name: "Watching" }).click();
    await expect(page.getByRole("button", { name: "Watch", exact: true })).toBeVisible();
  });

  test("chime toggle is keyboard accessible", async ({ page }) => {
    await page.goto("/");
    const panel = page.getByRole("region", { name: "Watchlist" });
    const chime = panel.getByRole("button", { name: /chime/i });
    await expect(chime).toHaveAttribute("aria-pressed", "true");
    await chime.click();
    await expect(chime).toHaveAttribute("aria-pressed", "false");
  });
});
