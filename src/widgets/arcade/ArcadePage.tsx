"use client";

import { useState } from "react";
import arcade from "@/shared/config/arcade.json";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { Badge, Card, CardBody, CardHeader, Tooltip } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";

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

const POTATO = {
  name: "Pot Potato",
  url: "https://potpotato.xyz",
  blurb: "Hold it if you dare: a hot-potato game where the pot moves on chain.",
};

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
        {game.repository ? (
          <ExternalLink href={game.repository} className="text-accent hover:underline">
            Source
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

/**
 * Games built on Chia, as registered on the arcade21 tracker: a build-time snapshot
 * (bun run arcade) because the tracker's JSON carries no CORS header, so a browser cannot
 * read it live and this app runs no proxy. Rooms are summarised from the same snapshot.
 */
export function ArcadePage() {
  const games = arcade.games as Game[];
  const [genre, setGenre] = useState<string>("all");
  const genres = [...new Set(games.map((g) => g.genre).filter((g): g is string => !!g))].sort();
  const shown = games.filter((g) => genre === "all" || g.genre === genre);
  const rooms = arcade.rooms.byStatus as Record<string, number>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Arcade</h1>
          <Tooltip
            text="Games built with Chia's gaming protocol: two players lock a stake in a state channel on chain, play off chain with cryptographic fairness (mental poker for cards), and settle the result back on chain. The catalogue comes from the arcade21 tracker."
            placement="bottom"
          />
        </div>
        <p className="text-sm text-fg-muted">
          {formatNumber(games.length)} games registered on the{" "}
          <ExternalLink href={arcade.tracker.url} className="text-accent hover:underline">
            {arcade.tracker.name} tracker
          </ExternalLink>{" "}
          as of {arcade.snapshotAt}. Playing needs a Chia wallet with the gaming protocol; each game
          opens on the tracker&apos;s own site.
        </p>
      </header>

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

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Games">
        {shown.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Game rooms"
            action={<span className="text-xs text-fg-faint">snapshot {arcade.snapshotAt}</span>}
          />
          <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
            <p>
              <span className="tabular font-semibold text-fg">
                {formatNumber(arcade.rooms.total)}
              </span>{" "}
              rooms announced on the tracker
              {Object.keys(rooms).length > 0
                ? ` (${Object.entries(rooms)
                    .map(([status, n]) => `${formatNumber(n)} ${status}`)
                    .join(", ")})`
                : ""}
              .
            </p>
            <p className="text-xs text-fg-faint">
              Live rooms cannot be read from your browser: the tracker answers without CORS headers
              and this site runs no proxy. Open{" "}
              <ExternalLink href={arcade.tracker.roomsUrl} className="text-accent hover:underline">
                the arcade
              </ExternalLink>{" "}
              to see who is waiting for an opponent right now.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={POTATO.name} />
          <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
            <p>{POTATO.blurb}</p>
            <ExternalLink href={POTATO.url} className="text-xs text-accent hover:underline">
              {POTATO.url.replace("https://", "")}
            </ExternalLink>
          </CardBody>
        </Card>
      </div>

      <p className="text-xs text-fg-faint">
        Games are listed as their developers registered them on the tracker; mempoolxch.space does
        not review them and stakes are real XCH. Refresh the catalogue with{" "}
        <span className="mono">bun run arcade</span>.
      </p>
    </div>
  );
}
