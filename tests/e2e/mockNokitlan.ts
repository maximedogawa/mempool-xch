import type { Page } from "@playwright/test";
import games from "../../src/test-utils/fixtures/nokitlan_games.json";
import leaderboard from "../../src/test-utils/fixtures/nokitlan_leaderboard.json";
import rooms from "../../src/test-utils/fixtures/nokitlan_rooms.json";

export const NOKITLAN_TRACKER = "https://tracker.nokitlan.com";

/** The nokitlan tracker from recorded fixtures; `available=true` answers the waiting rooms only. */
export async function mockNokitlan(page: Page) {
  await page.route(`${NOKITLAN_TRACKER}/**`, (route) => {
    const url = new URL(route.request().url());
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body),
      });
    if (url.pathname === "/games") return json(games);
    if (url.pathname === "/leaderboard") return json(leaderboard);
    if (url.pathname === "/rooms") {
      if (url.searchParams.get("available") !== "true") return json(rooms);
      const open = rooms.rooms.filter((r) => r.status === "waiting");
      return json({ ...rooms, total: open.length, rooms: open });
    }
    return route.fulfill({ status: 404, body: "not found" });
  });
}

/** Seeds Testnet11 as the selected network before the app boots. */
export async function selectTestnet(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mempool-xch:settings:v1",
      JSON.stringify({ network: "testnet11", theme: "dark" })
    );
  });
}
