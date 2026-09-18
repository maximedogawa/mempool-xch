"use client";

import { useState } from "react";
import arcade from "@/shared/config/arcade.json";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { Badge, Card, CardBody, CardHeader, Tooltip } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { PotPotatoCard } from "./PotPotatoCard";
import {
  ROOMS_LIVE,
  ROOMS_REFRESH_MS,
  useArcadeRooms,
  type ArcadeRoom,
  type RoomPhase,
} from "./useArcadeRooms";

interface Game {
  id: string;
  name: string;
  version: string | null;
  description: string;
  instructions: string | null;
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
  stats: { totalPlays?: number; activePlayers?: number } | null;
}

/** The manifest icon as an image, never as inline markup: a data: SVG in an <img> cannot run script. */
function GameIcon({ game }: { game: Game }) {
  if (!game.icon) {
    return (
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-sm bg-surface-2 text-lg font-semibold text-fg-muted"
      >
        {game.name.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a data: URI, nothing for next/image to optimise
    <img
      src={`data:image/svg+xml;utf8,${encodeURIComponent(game.icon)}`}
      alt=""
      width={48}
      height={48}
      className="h-12 w-12 rounded-sm"
    />
  );
}

function GameCard({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);
  return (
    <li
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
      data-testid={`game-${game.id}`}
    >
      <div className="flex items-start gap-3">
        <GameIcon game={game} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-fg">{game.name}</h3>
            {game.status ? (
              <Badge tone={game.status === "live" ? "primary" : "neutral"}>{game.status}</Badge>
            ) : null}
            {game.genre ? <Badge tone="info">{game.genre}</Badge> : null}
            {game.verified ? <Badge tone="primary">verified</Badge> : null}
          </div>
          <p className="text-sm text-fg-muted">{game.description}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-fg-muted sm:grid-cols-4">
        <dt className="text-fg-faint">Developer</dt>
        <dd className="truncate">
          {game.developer ? (
            game.developer.url ? (
              <ExternalLink href={game.developer.url} className="hover:text-fg">
                {game.developer.name}
              </ExternalLink>
            ) : (
              game.developer.name
            )
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-fg-faint">Stake</dt>
        <dd>{game.stakeTier ?? "—"}</dd>
        <dt className="text-fg-faint">Licence</dt>
        <dd>{game.license ?? "—"}</dd>
        <dt className="text-fg-faint">Plays</dt>
        <dd className="tabular">
          {game.stats?.totalPlays !== undefined ? formatNumber(game.stats.totalPlays) : "—"}
        </dd>
      </dl>
      {game.instructions ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="text-xs font-medium text-accent hover:underline"
          >
            {open ? "Hide how to play" : "How to play"}
          </button>
          {open ? <p className="mt-1 text-sm text-fg-muted">{game.instructions}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 text-xs">
        {game.playUrl ? (
          <ExternalLink
            href={game.playUrl}
            className="rounded-full border border-primary bg-primary-soft px-3 py-1 font-semibold text-primary hover:underline"
          >
            Play
          </ExternalLink>
        ) : null}
        {game.homepage ? (
          <ExternalLink href={game.homepage} className="text-accent hover:underline">
            Homepage
          </ExternalLink>
        ) : null}
      </div>
    </li>
  );
}

const PHASES: RoomPhase[] = ["waiting", "playing", "closed"];
const PHASE_TITLE: Record<RoomPhase, string> = {
  waiting: "Waiting for an opponent",
  playing: "In game",
  closed: "Closed",
};

function matchesRoom(room: ArcadeRoom, needle: string): boolean {
  if (!needle) return true;
  const q = needle.toLowerCase();
  return (
    (room.gameName ?? "").toLowerCase().includes(q) ||
    room.players.some((p) => p.toLowerCase().includes(q)) ||
    room.id.toLowerCase().includes(q) ||
    room.status.toLowerCase().includes(q)
  );
}

function RoomRow({ room }: { room: ArcadeRoom }) {
  return (
    <li className="flex flex-col gap-0.5 py-1.5 text-xs">
      <span className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-fg">{room.gameName ?? "Table"}</span>
        {room.joinUrl && room.phase !== "closed" ? (
          <ExternalLink href={room.joinUrl} className="shrink-0 text-accent hover:underline">
            {room.joinable ? "join" : "watch"}
          </ExternalLink>
        ) : null}
      </span>
      <span className="flex flex-wrap items-center gap-x-2 text-fg-muted">
        <span>{room.players.length > 0 ? room.players.join(" vs ") : "no players yet"}</span>
        {room.online > 0 ? <span className="text-primary">{room.online} online</span> : null}
        {room.wagerMojos !== null ? <span>{formatAmount(room.wagerMojos)} wager</span> : null}
        {room.gamesPlayed > 0 ? (
          <span>
            {formatNumber(room.gamesPlayed)} game{room.gamesPlayed === 1 ? "" : "s"}
          </span>
        ) : null}
        {room.updatedAt ? <span className="text-fg-faint">{formatAge(room.updatedAt)}</span> : null}
      </span>
    </li>
  );
}

/**
 * Live rooms from the tracker (hosted build), searchable, one accordion section per phase;
 * the snapshot summary when there are no rewrites (Sage export) or the tracker is down.
 */
function RoomsCard() {
  const rooms = useArcadeRooms();
  const [needle, setNeedle] = useState("");
  const snapshot = arcade.rooms.byStatus as Record<string, number>;
  const view = rooms.data;
  const filtered = (view?.rooms ?? []).filter((r) => matchesRoom(r, needle.trim()));
  return (
    <Card className="lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
      <CardHeader
        title="Game rooms"
        action={
          <span className="flex items-center gap-1.5 text-[11px] text-fg-faint">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                view ? "bg-primary" : "bg-fg-faint"
              )}
              aria-hidden="true"
            />
            {view
              ? `live · ${ROOMS_REFRESH_MS / 1000} s`
              : rooms.isLoading && ROOMS_LIVE
                ? "loading…"
                : `snapshot ${arcade.snapshotAt}`}
          </span>
        }
      />
      <CardBody className="flex flex-col gap-2">
        {view ? (
          <>
            <input
              type="search"
              value={needle}
              onChange={(e) => setNeedle(e.target.value)}
              placeholder="Search game or player"
              aria-label="Search rooms"
              className="w-full rounded-sm border border-border bg-bg px-2.5 py-1.5 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none"
            />
            {PHASES.map((phase) => {
              const list = filtered.filter((r) => r.phase === phase);
              return (
                <details
                  key={phase}
                  open={phase !== "closed"}
                  className="group rounded-sm border border-border bg-bg"
                  data-testid={`rooms-${phase}`}
                >
                  <summary className="flex cursor-pointer select-none items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium text-fg">
                    <span>
                      {PHASE_TITLE[phase]}
                      <span
                        className="ml-1.5 tabular text-fg-muted"
                        data-testid={`rooms-${phase}-count`}
                      >
                        {formatNumber(list.length)}
                        {needle.trim() ? ` of ${formatNumber(view.counts[phase])}` : ""}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-fg-faint transition-transform group-open:rotate-180"
                    >
                      ⌄
                    </span>
                  </summary>
                  {list.length === 0 ? (
                    <p className="px-2.5 pb-2 text-xs text-fg-faint">
                      {needle.trim() ? "No match." : "None right now."}
                    </p>
                  ) : (
                    <ul
                      className="flex flex-col divide-y divide-border/60 px-2.5 pb-1"
                      aria-label={PHASE_TITLE[phase]}
                    >
                      {list.slice(0, 20).map((room) => (
                        <RoomRow key={room.id} room={room} />
                      ))}
                    </ul>
                  )}
                </details>
              );
            })}
          </>
        ) : (
          <p className="text-xs text-fg-muted">
            <span className="tabular font-semibold text-fg">
              {formatNumber(arcade.rooms.total)}
            </span>{" "}
            rooms announced on the tracker
            {Object.keys(snapshot).length > 0
              ? ` (${Object.entries(snapshot)
                  .map(([status, n]) => `${formatNumber(n)} ${status}`)
                  .join(", ")})`
              : ""}
            .
          </p>
        )}
        <ExternalLink
          href={arcade.tracker.roomsUrl}
          className="text-[11px] text-accent hover:underline"
        >
          Open the arcade
        </ExternalLink>
      </CardBody>
    </Card>
  );
}

/**
 * Pot Potato on top (the only clock on the site that counts down), then the games registered
 * on the arcade21 tracker (snapshot, bun run arcade) and the live rooms.
 */
export function ArcadePage() {
  const games = arcade.games as Game[];
  const [genre, setGenre] = useState<string>("all");
  const genres = [...new Set(games.map((g) => g.genre).filter((g): g is string => !!g))].sort();
  const shown = games.filter((g) => genre === "all" || g.genre === genre);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Arcade</h1>
        <Tooltip
          text="Games built with Chia's gaming protocol: two players lock a stake in a state channel on chain, play off chain with cryptographic fairness (mental poker for cards), and settle the result back on chain. Playing needs a Chia wallet with the gaming protocol; each game opens on the tracker's own site."
          placement="bottom"
        />
      </header>

      <PotPotatoCard />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Games</h2>
            <div role="group" aria-label="Filter by genre" className="flex flex-wrap gap-1">
              {["all", ...genres].map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={genre === g}
                  onClick={() => setGenre(g)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize transition-colors",
                    genre === g
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Games">
            {shown.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </ul>
        </section>
        <RoomsCard />
      </div>

      <p className="text-xs text-fg-faint">
        Games are listed as their developers registered them on the{" "}
        <ExternalLink href={arcade.tracker.url} className="text-accent hover:underline">
          {arcade.tracker.name} tracker
        </ExternalLink>
        ; mempoolxch.space does not review them and stakes are real XCH.
      </p>
    </div>
  );
}
