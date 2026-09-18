import { expect, test } from "@playwright/test";
import arcade from "../../src/shared/config/arcade.json";
import { mockCoinset } from "./mockCoinset";

test.describe("arcade", () => {
  test("lists every game from the snapshot with icon, links and a genre filter", async ({
    page,
  }) => {
    await mockCoinset(page);
    await page.goto("/gaming");
    await expect(page.getByRole("heading", { level: 1, name: "Arcade" })).toBeVisible();
    const games = page.getByRole("list", { name: "Games" });
    await expect(games.getByRole("listitem")).toHaveCount(arcade.games.length);
    const first = games.getByTestId(`game-${arcade.games[0]!.id}`);
    await expect(first.getByRole("heading", { level: 3 })).toHaveText(arcade.games[0]!.name);
    await expect(first.locator("img[src^='data:image/svg+xml']")).toBeVisible();
    await expect(first.getByRole("link", { name: "Play" })).toHaveAttribute(
      "href",
      arcade.games[0]!.playUrl!
    );
    await first.getByRole("button", { name: "How to play" }).click();
    await expect(first.getByText(arcade.games[0]!.instructions!.slice(0, 40))).toBeVisible();

    const genre = arcade.games.find((g) => g.genre)!.genre!;
    await page
      .getByRole("group", { name: "Filter by genre" })
      .getByRole("button", { name: genre, exact: true })
      .click();
    await expect(games.getByRole("listitem")).toHaveCount(
      arcade.games.filter((g) => g.genre === genre).length
    );

    await expect(page.getByText(new RegExp(`${arcade.rooms.total} rooms announced`))).toBeVisible();
    await expect(page.getByText(/tracker answers without CORS headers/)).toBeVisible();
    await expect(page.getByRole("link", { name: "potpotato.xyz" })).toBeVisible();
  });

  test("Arcade sits in the More menu", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/");
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "Arcade" }).click();
    await expect(page).toHaveURL(/\/gaming$/);
  });
});
