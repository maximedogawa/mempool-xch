"use client";

import { useQuery } from "@tanstack/react-query";
import type { GamingProvider } from "@/shared/config/gaming";
import {
  parseGames,
  parseLeaderboard,
  parseRooms,
  sortOpenRooms,
  type DuelRoom,
  type Page,
} from "@/shared/lib/gaming/nokitlan";
import { useSettings } from "@/shared/providers/SettingsProvider";

export const DUELS_REFRESH_MS = 20_000;

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`tracker HTTP ${response.status}`);
  return response.json();
}

/** The catalogue changes when a developer publishes a game: minutes, not seconds. */
export function useDuelGames(provider: GamingProvider) {
  const { hydrated } = useSettings();
  return useQuery({
    queryKey: ["gaming", provider.id, "games"],
    enabled: hydrated,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async ({ signal }) =>
      parseGames(await getJson(`${provider.trackerUrl}/games?limit=100`, signal), provider.appUrl),
  });
}

export interface DuelRoomsView {
  /** Rooms anyone can join right now, hosts online first. */
  open: Page<DuelRoom>;
  /** The newest rooms of every status; `total` is every room the tracker has seen. */
  recent: Page<DuelRoom>;
}

export function useDuelRooms(provider: GamingProvider) {
  const { hydrated } = useSettings();
  return useQuery({
    queryKey: ["gaming", provider.id, "rooms"],
    enabled: hydrated,
    refetchInterval: DUELS_REFRESH_MS,
    staleTime: DUELS_REFRESH_MS,
    retry: 1,
    queryFn: async ({ signal }): Promise<DuelRoomsView> => {
      const [open, recent] = await Promise.all([
        getJson(`${provider.trackerUrl}/rooms?available=true&limit=30`, signal),
        getJson(`${provider.trackerUrl}/rooms?limit=40`, signal),
      ]);
      const openPage = parseRooms(open, provider.appUrl);
      const recentPage = parseRooms(recent, provider.appUrl);
      const openIds = new Set(openPage.items.map((r) => r.id));
      return {
        open: { total: openPage.total, items: sortOpenRooms(openPage.items) },
        recent: {
          total: recentPage.total,
          items: recentPage.items.filter((r) => !openIds.has(r.id) && r.phase !== "open"),
        },
      };
    },
  });
}

export function useDuelLeaderboard(provider: GamingProvider) {
  const { hydrated } = useSettings();
  return useQuery({
    queryKey: ["gaming", provider.id, "leaderboard"],
    enabled: hydrated,
    refetchInterval: 60_000,
    staleTime: 60_000,
    retry: 1,
    queryFn: async ({ signal }) =>
      parseLeaderboard(
        await getJson(`${provider.trackerUrl}/leaderboard?sort=wins&limit=10`, signal)
      ),
  });
}
