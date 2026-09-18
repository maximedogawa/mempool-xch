/**
 * Snapshots the Chia arcade catalogue into src/shared/config/arcade.json. The arcade21 tracker
 * publishes its games and rooms as JSON but without CORS headers, so a browser cannot read it
 * and decision-012 rules out a proxy; the catalogue changes rarely, so it is committed like
 * the changelog and refreshed by hand:
 *
 *   bun run arcade
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const TRACKER = "https://arcade21games.com";

interface TrackerGame {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  icon?: string;
  homepage?: string | null;
  repository?: string | null;
  gameType?: string;
  author?: { name?: string; url?: string } | null;
  registeredAt?: string | number;
  updatedAt?: string | number;
  verified?: boolean;
  active?: boolean;
  genre?: string | null;
  status?: string | null;
  stakeTier?: string | null;
  stats?: Record<string, unknown> | null;
  manifest?: {
    instructions?: string;
    license?: string;
    gameUrl?: string;
    author?: { name?: string; url?: string } | null;
    sdkVersion?: string;
  };
}

interface Game {
  id: string;
  name: string;
  version: string | null;
  description: string;
  instructions: string | null;
  /** Inline SVG from the manifest, shown as a data: image so it can never run script. */
  icon: string | null;
  developer: { name: string; url: string | null } | null;
  license: string | null;
  playUrl: string | null;
  homepage: string | null;
  repository: string | null;
  gameType: string | null;
  genre: string | null;
  status: string | null;
  stakeTier: string | null;
  verified: boolean;
  active: boolean;
  stats: Record<string, unknown> | null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${TRACKER}${path}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function main() {
  const catalogue = await getJson<{ games?: TrackerGame[] }>("/games?limit=200");
  const games: Game[] = (catalogue.games ?? [])
    .map((g): Game => {
      const m = g.manifest ?? {};
      const author = g.author ?? m.author ?? null;
      return {
        id: str(g.id) ?? str(g.name) ?? "unknown",
        name: str(g.name) ?? "Untitled game",
        version: str(g.version),
        description: str(g.description) ?? "",
        instructions: str(m.instructions),
        icon: str(g.icon)?.startsWith("<svg") ? g.icon!.trim() : null,
        developer:
          author && str(author.name) ? { name: author.name!.trim(), url: str(author.url) } : null,
        license: str(m.license),
        playUrl: str(m.gameUrl),
        homepage: str(g.homepage),
        repository: str(g.repository),
        gameType: str(g.gameType),
        genre: str(g.genre),
        status: str(g.status),
        stakeTier: str(g.stakeTier),
        verified: Boolean(g.verified),
        active: g.active !== false,
        stats: g.stats && typeof g.stats === "object" ? g.stats : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const announce = await getJson<{ total?: number; rooms?: { status?: string }[] }>(
    "/announce?limit=200"
  );
  const rooms: Record<string, number> = {};
  for (const room of announce.rooms ?? [])
    rooms[str(room.status) ?? "unknown"] = (rooms[str(room.status) ?? "unknown"] ?? 0) + 1;

  const out = {
    snapshotAt: new Date().toISOString().slice(0, 10),
    tracker: { name: "arcade21", url: TRACKER, roomsUrl: "https://chia.arcade21games.com/" },
    games,
    rooms: { total: announce.total ?? (announce.rooms ?? []).length, byStatus: rooms },
  };
  const target = join(import.meta.dir, "../../src/shared/config/arcade.json");
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote ${target}: ${games.length} games, ${out.rooms.total} rooms`);
}

await main();
