import { describe, expect, test } from "bun:test";
import games from "@/test-utils/fixtures/nokitlan_games.json";
import leaderboard from "@/test-utils/fixtures/nokitlan_leaderboard.json";
import rooms from "@/test-utils/fixtures/nokitlan_rooms.json";
import { links, mojos, parseGames, parseLeaderboard, parseRooms, sortOpenRooms } from "./nokitlan";

const APP = "https://testnet.nokitlan.com";

describe("nokitlan tracker", () => {
  test("games: manifest fields, icon kept as SVG text, link into the app", () => {
    const page = parseGames(games, APP);
    expect(page.total).toBe(games.total);
    expect(page.items).toHaveLength(games.games.length);
    const dominoes = page.items.find((g) => g.slug === "dominoes")!;
    expect(dominoes.name).toBe("Dominoes");
    expect(dominoes.author).toEqual({ name: "Mr Dennis", url: "https://mrdennis.dev" });
    expect(dominoes.license).toBe("MIT");
    expect(dominoes.icon?.startsWith("<svg")).toBe(true);
    expect(dominoes.url).toBe(`${APP}/#/games/${dominoes.id}`);
  });

  test("games: inactive entries, non-SVG icons and non-https author links are dropped", () => {
    const page = parseGames(
      {
        total: 2,
        games: [
          { id: "a", name: "Gone", active: false },
          {
            id: "b",
            name: "Odd",
            manifest: { icon: "javascript:alert(1)", author: { name: "x", url: "http://x" } },
          },
          { name: "no id" },
        ],
      },
      APP
    );
    expect(page.items.map((g) => g.id)).toEqual(["b"]);
    expect(page.items[0]!.icon).toBeNull();
    expect(page.items[0]!.author).toEqual({ name: "x", url: null });
  });

  test("rooms: phases follow nokitlan's own labels", () => {
    const page = parseRooms(rooms, APP);
    expect(page.total).toBe(rooms.total);
    const byStatus = (s: string) => page.items.filter((r) => r.status === s);
    for (const r of byStatus("waiting")) {
      expect(r.phase).toBe("open");
      expect(r.guest).toBeNull();
      expect(r.url).toBe(`${APP}/#/rooms/${r.id}/join`);
    }
    for (const r of byStatus("closed")) expect(r.phase).toBe("closed");
    // Seated rooms are live while someone is online, idle otherwise.
    const seated = [...byStatus("active"), ...byStatus("playing")];
    expect(seated.length).toBeGreaterThan(0);
    for (const r of seated) {
      expect(r.phase).toBe(r.host?.online || r.guest?.online ? "live" : "idle");
    }
  });

  test("rooms: stake in mojos, games played first, links never follow appBaseUrl", () => {
    const page = parseRooms(rooms, APP);
    const bot = page.items.find((r) => r.host?.name === "Gambit [bot]")!;
    expect(bot.stake).toBe(1_000_000_000n);
    expect(bot.games).toContain("California Poker");
    const wordlock = page.items.find((r) => r.id.startsWith("aff0eebd"))!;
    expect(wordlock.games[0]).toBe("Wordlock");
    for (const r of page.items) expect(r.url.startsWith(`${APP}/#/rooms/`)).toBe(true);
  });

  test("open rooms sort online hosts first", () => {
    const open = parseRooms(rooms, APP).items.filter((r) => r.phase === "open");
    const first = open[0]!;
    const offline = { ...first, id: "offline", host: { ...first.host!, online: false } };
    const sorted = sortOpenRooms([offline, ...open]);
    expect(sorted.at(-1)!.id).toBe("offline");
  });

  test("leaderboard rows with net mojos as bigint", () => {
    const page = parseLeaderboard(leaderboard);
    expect(page.total).toBe(leaderboard.total);
    expect(page.items[0]).toMatchObject({ rank: 1, name: "Noki", wins: 332, net: 2096n });
    expect(page.items.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5]);
  });

  test("garbage in, empty pages out", () => {
    expect(parseRooms(null, APP)).toEqual({ total: 0, items: [] });
    expect(parseLeaderboard({ rows: "nope" })).toEqual({ total: 0, items: [] });
    expect(mojos("12abc")).toBe(0n);
    expect(mojos(-5)).toBe(-5n);
    expect(links.room(APP, "a b", "live")).toBe(`${APP}/#/rooms/a%20b/watch`);
  });
});
