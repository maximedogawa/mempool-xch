import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import arcade from "../../src/shared/config/arcade.json";
import games from "../../src/test-utils/fixtures/nokitlan_games.json";
import rooms from "../../src/test-utils/fixtures/nokitlan_rooms.json";
import { mockArcadeRooms } from "./mockArcade";
import { mockCoinset } from "./mockCoinset";
import { mockNokitlan, NOKITLAN_TRACKER, selectTestnet } from "./mockNokitlan";

test.describe("arcade", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockArcadeRooms(page);
  });

  test("Pot Potato on top: the clock counts down from the snatch the mock added on the snapshot", async ({
    page,
  }) => {
    await page.goto("/gaming");
    await expect(page.getByRole("heading", { level: 1, name: "Arcade" })).toBeVisible();
    // Snapshot tip + one mocked snatch an hour ago: 23 h left, one more XCH in the pot.
    await expect(page.getByTestId("potato-snatches")).toHaveText(
      (arcade.potato.hops + 1).toLocaleString("en-US")
    );
    await expect(page.getByTestId("potato-pot")).toHaveText(
      `${(Number(BigInt(arcade.potato.amount) / 1_000_000_000_000n) + 1).toLocaleString("en-US")} XCH`
    );
    await expect(page.getByTestId("potato-clock")).toHaveText(/^22:5\d:\d\d$/);
    await expect(page.getByText("following the coin live")).toBeVisible();
    const before = await page.getByTestId("potato-clock").textContent();
    await page.waitForTimeout(2_100);
    expect(await page.getByTestId("potato-clock").textContent()).not.toBe(before);
    await expect(
      page.getByRole("meter", { name: "Share of the hold already served" })
    ).toHaveAttribute("aria-valuenow", "4");
  });

  test("rooms come live through the rewrite: searchable, one accordion section per phase", async ({
    page,
  }) => {
    await page.goto("/gaming");
    await expect(page.getByTestId("rooms-waiting-count")).toHaveText("1");
    await expect(page.getByTestId("rooms-playing-count")).toHaveText("1");
    await expect(page.getByTestId("rooms-closed-count")).toHaveText("1");
    const waiting = page.getByRole("list", { name: "Waiting for an opponent" });
    await expect(waiting).toContainText("Crazy Eights");
    await expect(waiting).toContainText("alice");
    await expect(waiting).toContainText("0.01 XCH wager");
    await expect(waiting.getByRole("link", { name: "join" })).toHaveAttribute(
      "href",
      /roomId=room-open/
    );
    await expect(page.getByRole("list", { name: "In game" })).toContainText("bob vs carol");
    // Closed rooms start collapsed; opening the section reveals them.
    await expect(page.getByRole("list", { name: "Closed" })).toBeHidden();
    await page.getByTestId("rooms-closed").locator("summary").click();
    await expect(page.getByRole("list", { name: "Closed" })).toContainText("dan vs eve");

    await page.getByRole("searchbox", { name: "Search rooms" }).fill("carol");
    await expect(page.getByTestId("rooms-waiting-count")).toHaveText("0 of 1");
    await expect(page.getByTestId("rooms-playing-count")).toHaveText("1 of 1");
    await expect(page.getByText(/live · 30 s/)).toBeVisible();
  });

  test("games: no source links, no intro sentence, genre filter, play opens the arcade21 site", async ({
    page,
  }) => {
    await page.goto("/gaming");
    const games = page.getByRole("list", { name: "Games" });
    await expect(games.getByRole("listitem")).toHaveCount(arcade.games.length);
    // Playing needs an arcade21 account and a WalletConnect wallet: every Play link opens the
    // arcade21 website, never the bare game page.
    const play = games.getByRole("link", { name: `Play on ${arcade.tracker.name}` });
    await expect(play).toHaveCount(arcade.games.length);
    for (const href of await play.evaluateAll((links) => links.map((a) => a.getAttribute("href"))))
      expect(href).toBe(arcade.tracker.url);
    await expect(games.locator('a[href*="/game-assets/"]')).toHaveCount(0);
    await expect(games.getByRole("link", { name: "Source" })).toHaveCount(0);
    await expect(page.getByText(/games registered on the/)).toHaveCount(0);
    await expect(page.getByText(/cannot be read from your browser/)).toHaveCount(0);
    const genre = arcade.games.find((g) => g.genre)!.genre!;
    await page
      .getByRole("group", { name: "Filter by genre" })
      .getByRole("button", { name: genre, exact: true })
      .click();
    await expect(games.getByRole("listitem")).toHaveCount(
      arcade.games.filter((g) => g.genre === genre).length
    );
  });

  test("when the tracker is unreachable the rooms card falls back to the snapshot", async ({
    page,
  }) => {
    await page.unroute("**/api/arcade/announce**");
    await page.route("**/api/arcade/announce**", (route) =>
      route.fulfill({ status: 502, body: "bad gateway" })
    );
    await page.goto("/gaming");
    await expect(
      page.getByText(new RegExp(`${arcade.rooms.total} rooms announced on the tracker`))
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("testnet gaming", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockNokitlan(page);
    await selectTestnet(page);
  });

  test("games, open rooms and the leaderboard come live from the nokitlan tracker", async ({
    page,
  }) => {
    await page.goto("/gaming");
    await expect(page.getByText("Testnet11 · live from nokitlan")).toBeVisible();
    const shelf = page.getByRole("list", { name: "Games" });
    await expect(shelf.getByRole("listitem")).toHaveCount(games.games.length);
    await expect(
      page.getByTestId("duel-game-dominoes").getByRole("link", { name: "Play" })
    ).toHaveAttribute("href", `https://testnet.nokitlan.com/#/games/${games.games[0]!.id}`);

    const waiting = rooms.rooms.filter((r) => r.status === "waiting");
    const open = page.getByRole("list", { name: "Open to join" });
    await expect(open.getByRole("listitem")).toHaveCount(waiting.length);
    await expect(open.getByRole("link", { name: "Join" }).first()).toHaveAttribute(
      "href",
      /^https:\/\/testnet\.nokitlan\.com\/#\/rooms\/[0-9a-f-]+\/join$/
    );
    await expect(open).toContainText("1 TXCH stake");
    await expect(page.getByRole("list", { name: "Recent duels" })).toContainText("finished");
    await expect(page.getByTestId("duels-leaderboard")).toContainText("Noki");
    await expect(page.getByText(/live · 20 s/)).toBeVisible();
  });

  test("an unreachable tracker says so instead of breaking the page", async ({ page }) => {
    await page.unroute(`${NOKITLAN_TRACKER}/**`);
    await page.route(`${NOKITLAN_TRACKER}/**`, (route) =>
      route.fulfill({ status: 502, body: "bad gateway" })
    );
    await page.goto("/gaming");
    await expect(page.getByText(/nokitlan tracker is not answering/).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Open a room" }).first()).toBeVisible();
  });

  test("axe passes on the testnet view", async ({ page }) => {
    await page.goto("/gaming");
    await expect(page.getByTestId("duels-leaderboard")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
