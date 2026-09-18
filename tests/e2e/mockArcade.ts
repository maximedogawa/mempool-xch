import type { Page } from "@playwright/test";

/** Rooms as the arcade21 tracker announces them, served through the /api/arcade rewrite. */
export async function mockArcadeRooms(page: Page) {
  const now = Date.now();
  await page.route("**/api/arcade/announce**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        "tracker id": "arcade21",
        total: 3,
        rooms: [
          {
            roomId: "room-open",
            status: "waiting",
            joinable: true,
            public: true,
            player1Name: "alice",
            player2Name: null,
            activeGameType: "6372617a79656967687473",
            activeGameWager: 10_000_000_000,
            totalGamesPlayed: 0,
            createdAt: now - 60_000,
            updatedAt: now - 30_000,
            appBaseUrl: "https://chia.arcade21games.com/?roomId=room-open",
            player1Online: true,
          },
          {
            roomId: "room-live",
            status: "playing",
            joinable: false,
            public: true,
            player1Name: "bob",
            player2Name: "carol",
            activeGameType: "8694c87aff7b75a1017f0ab9eb0911f1ffb2c4744f74c2df1579747f98222d7c",
            activeGameWager: 0,
            totalGamesPlayed: 2,
            createdAt: now - 600_000,
            updatedAt: now - 5_000,
            appBaseUrl: "https://chia.arcade21games.com/?roomId=room-live",
            player1Online: true,
            player2Online: true,
          },
          {
            roomId: "room-done",
            status: "closed",
            joinable: false,
            public: true,
            player1Name: "dan",
            player2Name: "eve",
            activeGameType: null,
            totalGamesPlayed: 1,
            createdAt: now - 86_400_000,
            updatedAt: now - 3_600_000,
            appBaseUrl: null,
          },
        ],
      }),
    })
  );
}
