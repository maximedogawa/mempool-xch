"use client";

import { useQuery } from "@tanstack/react-query";
import arcade from "@/shared/config/arcade.json";

/** Rewrites exist in the hosted build only; the Sage export keeps the snapshot. */
export const ROOMS_LIVE = process.env.NEXT_PUBLIC_SAGE_BUILD !== "1";
const ROOMS_URL = "/api/arcade/announce?limit=100";
export const ROOMS_REFRESH_MS = 30_000;

export type RoomPhase = "waiting" | "playing" | "closed";

export interface ArcadeRoom {
  id: string;
  phase: RoomPhase;
  status: string;
  gameName: string | null;
  players: string[];
  online: number;
  /** Wager of the active game in mojos, when one is set. */
  wagerMojos: bigint | null;
  gamesPlayed: number;
  createdAt: number | null;
  updatedAt: number | null;
  joinUrl: string | null;
  joinable: boolean;
}

interface RawRoom {
  roomId?: string;
  status?: string;
  gameType?: string | null;
  activeGameType?: string | null;
  player1Name?: string | null;
  player2Name?: string | null;
  player1Online?: boolean;
  player2Online?: boolean;
  activeGameWager?: number | null;
  wagerAmount?: number | null;
  totalGamesPlayed?: number;
  createdAt?: number;
  updatedAt?: number;
  appBaseUrl?: string | null;
  joinable?: boolean;
  public?: boolean;
}

const GAME_BY_TYPE = new Map(
  arcade.games.filter((g) => g.gameType).map((g) => [g.gameType as string, g.name])
);

function phaseOf(status: string, joinable: boolean): RoomPhase {
  const s = status.toLowerCase();
  if (joinable || /wait|open|lobby|created/.test(s)) return "waiting";
  if (/play|active|in_game|ingame|running|live/.test(s)) return "playing";
  return "closed";
}

export function normaliseRoom(raw: RawRoom): ArcadeRoom | null {
  if (!raw || typeof raw.roomId !== "string") return null;
  const status = typeof raw.status === "string" ? raw.status : "unknown";
  const players = [raw.player1Name, raw.player2Name]
    .filter((p): p is string => typeof p === "string" && p.trim() !== "")
    .map((p) => p.trim());
  const wager = raw.activeGameWager ?? raw.wagerAmount ?? null;
  return {
    id: raw.roomId,
    phase: phaseOf(status, raw.joinable === true),
    status,
    gameName: GAME_BY_TYPE.get(raw.activeGameType ?? raw.gameType ?? "") ?? null,
    players,
    online: [raw.player1Online, raw.player2Online].filter(Boolean).length,
    wagerMojos: typeof wager === "number" && wager > 0 ? BigInt(Math.round(wager)) : null,
    gamesPlayed: typeof raw.totalGamesPlayed === "number" ? raw.totalGamesPlayed : 0,
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : null,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : null,
    joinUrl: typeof raw.appBaseUrl === "string" ? raw.appBaseUrl : null,
    joinable: raw.joinable === true,
  };
}

export interface RoomsView {
  rooms: ArcadeRoom[];
  counts: Record<RoomPhase, number>;
  total: number;
  /** Unix ms of the last successful fetch. */
  fetchedAt: number;
}

/** Live rooms from the tracker through /api/arcade; sorted so waiting and playing rooms come first. */
export function useArcadeRooms() {
  return useQuery({
    queryKey: ["arcade", "rooms"],
    enabled: ROOMS_LIVE,
    refetchInterval: ROOMS_REFRESH_MS,
    staleTime: ROOMS_REFRESH_MS,
    retry: 1,
    queryFn: async ({ signal }): Promise<RoomsView> => {
      const response = await fetch(ROOMS_URL, { signal, headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`tracker HTTP ${response.status}`);
      const body = (await response.json()) as { total?: number; rooms?: RawRoom[] };
      const order: Record<RoomPhase, number> = { waiting: 0, playing: 1, closed: 2 };
      const rooms = (body.rooms ?? [])
        .map(normaliseRoom)
        .filter((r): r is ArcadeRoom => r !== null)
        .sort((a, b) => order[a.phase] - order[b.phase] || (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      const counts: Record<RoomPhase, number> = { waiting: 0, playing: 0, closed: 0 };
      rooms.forEach((r) => (counts[r.phase] += 1));
      return { rooms, counts, total: body.total ?? rooms.length, fetchedAt: Date.now() };
    },
  });
}
