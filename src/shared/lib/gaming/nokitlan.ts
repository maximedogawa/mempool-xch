/**
 * The nokitlan tracker (tracker.nokitlan.com), read straight from the browser: it answers with
 * Access-Control-Allow-Origin: *. Everything here is pure: raw JSON in, display records out,
 * so the shapes are pinned by recorded fixtures (src/test-utils/fixtures/nokitlan_*.json).
 * The tracker is third-party input: every field is checked, nothing is trusted to exist.
 */

import type { Mojos } from "@/shared/lib/chia/amounts";

export interface DuelGame {
  id: string;
  slug: string;
  name: string;
  version: string | null;
  description: string;
  instructions: string | null;
  /** SVG markup from the developer's manifest. Render only as an <img> data: URI, never inline. */
  icon: string | null;
  author: { name: string; url: string | null } | null;
  license: string | null;
  updatedAt: number | null;
  /** The game's page in the nokitlan app, where rooms for it are opened. */
  url: string;
}

/** open: waiting for an opponent; live: both seated and someone online; idle: seated, nobody here. */
export type DuelPhase = "open" | "live" | "idle" | "closed";

export interface DuelPlayer {
  name: string;
  /** Wallet public key, the id nokitlan's profiles and leaderboard use. */
  pubkey: string | null;
  online: boolean;
}

export interface DuelRoom {
  id: string;
  phase: DuelPhase;
  status: string;
  /** Names of the games the room offers, or the one being played right now first. */
  games: string[];
  host: DuelPlayer | null;
  guest: DuelPlayer | null;
  stake: Mojos;
  /** Mojos locked in the state channel once it is funded. */
  channel: Mojos;
  createdAt: number | null;
  updatedAt: number | null;
  url: string;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  pubkey: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  net: Mojos;
}

export interface Page<T> {
  total: number;
  items: T[];
}

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const httpsUrl = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  try {
    return new URL(s).protocol === "https:" ? s : null;
  } catch {
    return null;
  }
};

/** Mojo amounts arrive as decimal strings or plain numbers; anything else counts as zero. */
export function mojos(v: unknown): Mojos {
  if (typeof v === "number" && Number.isSafeInteger(v)) return BigInt(v);
  if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return BigInt(v.trim());
  return 0n;
}

function pageOf<T>(body: unknown, key: string, map: (raw: unknown) => T | null): Page<T> {
  const list = isObject(body) && Array.isArray(body[key]) ? (body[key] as unknown[]) : [];
  const items = list.map(map).filter((x): x is T => x !== null);
  const total = isObject(body) ? num(body.total) : null;
  return { total: total ?? items.length, items };
}

export const links = {
  game: (app: string, id: string) => `${app}/#/games/${encodeURIComponent(id)}`,
  profile: (app: string, pubkey: string) => `${app}/#/profile/${encodeURIComponent(pubkey)}`,
  rooms: (app: string) => `${app}/#/rooms`,
  newRoom: (app: string) => `${app}/#/rooms/new`,
  leaderboard: (app: string) => `${app}/#/leaderboard`,
  room(app: string, id: string, phase: DuelPhase) {
    const base = `${app}/#/rooms/${encodeURIComponent(id)}`;
    if (phase === "open") return `${base}/join`;
    if (phase === "live") return `${base}/watch`;
    return base;
  },
};

export function normaliseGame(raw: unknown, app: string): DuelGame | null {
  if (!isObject(raw)) return null;
  const id = str(raw.id);
  const name = str(raw.name);
  if (!id || !name || raw.active === false) return null;
  const manifest = isObject(raw.manifest) ? raw.manifest : {};
  const author = isObject(manifest.author) ? manifest.author : null;
  const icon = str(manifest.icon);
  return {
    id,
    slug: str(raw.slug) ?? id,
    name,
    version: str(raw.version) ?? str(manifest.version),
    description: str(manifest.description) ?? "",
    instructions: str(manifest.instructions),
    icon: icon && icon.trimStart().startsWith("<svg") ? icon : null,
    author:
      author && str(author.name) ? { name: str(author.name)!, url: httpsUrl(author.url) } : null,
    license: str(manifest.license),
    updatedAt: num(raw.updatedAt),
    url: links.game(app, id),
  };
}

function player(raw: unknown): DuelPlayer | null {
  if (!isObject(raw)) return null;
  return {
    name: str(raw.name)?.trim() ?? "anonymous",
    pubkey: str(raw.walletPublicKey),
    online: raw.online === true,
  };
}

/** Mirrors how nokitlan labels a room: closed, waiting without a guest, else live or idle. */
export function roomPhase(status: string, host: DuelPlayer | null, guest: DuelPlayer | null) {
  if (status === "closed") return "closed" as const;
  if (!guest) return "open" as const;
  return host?.online || guest.online ? ("live" as const) : ("idle" as const);
}

export function normaliseRoom(raw: unknown, app: string): DuelRoom | null {
  if (!isObject(raw)) return null;
  const id = str(raw.roomId);
  if (!id) return null;
  const status = str(raw.status) ?? "unknown";
  const host = player(raw.player1);
  const guest = player(raw.player2);
  const phase = roomPhase(status, host, guest);
  const names = (list: unknown, pick: (g: Raw) => unknown) =>
    Array.isArray(list)
      ? list
          .filter(isObject)
          .map((g) => str(pick(g)))
          .filter((n): n is string => n !== null)
      : [];
  const playing = names(raw.activeGames, (g) => (isObject(g.game) ? g.game.name : null));
  const offered = names(raw.gamesAccepted, (g) => g.name);
  return {
    id,
    phase,
    status,
    games: [...new Set([...playing, ...offered])],
    host,
    guest,
    stake: mojos(raw.publisherStake),
    channel: mojos(raw.channelFundedAmount),
    createdAt: num(raw.createdAt),
    updatedAt: num(raw.updatedAt),
    // appBaseUrl is where the host opened the room, often a local Sage app URL nobody else can
    // reach; the public app serves every room on the tracker.
    url: links.room(app, id, phase),
  };
}

export function normaliseLeaderboardRow(raw: unknown): LeaderboardRow | null {
  if (!isObject(raw)) return null;
  const pubkey = str(raw.pubkey);
  const rank = num(raw.rank);
  if (!pubkey || rank === null) return null;
  return {
    rank,
    name: str(raw.name)?.trim() ?? "anonymous",
    pubkey,
    games: num(raw.games) ?? 0,
    wins: num(raw.wins) ?? 0,
    losses: num(raw.losses) ?? 0,
    draws: num(raw.draws) ?? 0,
    winRate: num(raw.winRate) ?? 0,
    net: mojos(raw.netMojos),
  };
}

export const parseGames = (body: unknown, app: string) =>
  pageOf(body, "games", (r) => normaliseGame(r, app));
export const parseRooms = (body: unknown, app: string) =>
  pageOf(body, "rooms", (r) => normaliseRoom(r, app));
export const parseLeaderboard = (body: unknown) => pageOf(body, "rows", normaliseLeaderboardRow);

/** Open rooms whose host is online first (those can actually start), then newest. */
export function sortOpenRooms(rooms: DuelRoom[]): DuelRoom[] {
  return [...rooms].sort(
    (a, b) =>
      Number(b.host?.online ?? false) - Number(a.host?.online ?? false) ||
      (b.createdAt ?? 0) - (a.createdAt ?? 0)
  );
}
