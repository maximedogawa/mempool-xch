/**
 * Snapshots the Chia arcade into src/shared/config/arcade.json: the arcade21 catalogue and
 * rooms (its JSON has no CORS header; the hosted build proxies it through a rewrite, the
 * Sage export shows this snapshot) and the Pot Potato tip. Walking the potato from genesis
 * costs one Coinset call per snatch (six minutes for ~2,000), so the previous snapshot's tip
 * is the starting point and only new snatches are walked; the browser does the same from
 * the committed tip. Refresh by hand:
 *
 *   bun run arcade
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRpcClient } from "../../src/shared/lib/rpc/client";
import {
  advanceTip,
  POTATO,
  potatoChild,
  type PotatoTip,
} from "../../src/shared/lib/potato/potato";

const TRACKER = "https://arcade21games.com";
const COINSET = "https://api.coinset.org";
const TARGET = join(import.meta.dir, "../../src/shared/config/arcade.json");

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

  // The tracker registers every game with the same private ChiaGameTemplate repository, which
  // is neither the game's source nor reachable; repositories are not shown at all.
  for (const g of games) g.repository = null;

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
    potato: await walkPotato(),
  };
  writeFileSync(TARGET, `${JSON.stringify(out, null, 2)}\n`);
  console.log(
    `wrote ${TARGET}: ${games.length} games, ${out.rooms.total} rooms, potato at ${out.potato.hops} snatches`
  );
}

/** Continues the potato lineage from the last committed tip (or genesis) to the live tip. */
async function walkPotato(): Promise<PotatoTip> {
  const client = createRpcClient({ rpcUrl: COINSET, indexedUrl: COINSET });
  const previous = existsSync(TARGET)
    ? ((JSON.parse(readFileSync(TARGET, "utf8")) as { potato?: PotatoTip }).potato ?? null)
    : null;
  let tip: PotatoTip;
  if (previous && !previous.ended) tip = previous;
  else {
    const genesis = await client.getCoinRecordByName(POTATO.genesis);
    tip = {
      coinId: genesis.name,
      amount: genesis.coin.amount.toString(),
      height: genesis.confirmedBlockIndex,
      timestamp: genesis.timestamp,
      hops: 0,
      ended: false,
    };
  }
  for (;;) {
    const children = await client.getCoinRecordsByParentIds([tip.coinId], true);
    if (children.length === 0) break;
    const child = potatoChild(BigInt(tip.amount), children);
    if (!child) {
      tip = { ...tip, ended: true };
      break;
    }
    tip = advanceTip(tip, child);
    if (tip.hops % 100 === 0) console.log(`potato: ${tip.hops} snatches…`);
    if (!child.spent) break;
  }
  return tip;
}

await main();
