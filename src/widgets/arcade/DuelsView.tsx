"use client";

import { useState } from "react";
import type { GamingProvider } from "@/shared/config/gaming";
import { formatAmount, formatNumber, formatPercent, type Mojos } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import {
  links,
  type DuelGame,
  type DuelPlayer,
  type DuelRoom,
  type LeaderboardRow,
} from "@/shared/lib/gaming/nokitlan";
import { useT } from "@/shared/i18n/useT";
import { Badge, Card, CardBody, CardHeader, Skeleton, StatTile } from "@/shared/ui";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import arcadeNs from "@/shared/i18n/messages/en/arcade";
import { DUELS_REFRESH_MS, useDuelGames, useDuelLeaderboard, useDuelRooms } from "./useDuels";

const FAUCET_URL = "https://testnet11-faucet.chia.net/";

/** Testnet amounts read as TXCH so nobody mistakes a test stake for real money. */
const txch = (m: Mojos) => formatAmount(m).replace(/XCH$/, "TXCH");

/** The manifest icon as an image, never as inline markup: a data: SVG in an <img> cannot run script. */
function DuelIcon({ game, size }: { game: Pick<DuelGame, "icon" | "name">; size: number }) {
  if (!game.icon) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-card bg-surface-2 text-lg font-semibold text-fg-muted"
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
      width={size}
      height={size}
      className="shrink-0 rounded-card shadow-sm"
    />
  );
}

/** Initials on a colour picked from the key, so the same player looks the same everywhere. */
function PlayerBadge({ player, app }: { player: DuelPlayer; app: string }) {
  let hue = 0;
  for (const ch of player.pubkey ?? player.name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  const face = (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <span
        aria-hidden="true"
        className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: `hsl(${hue} 55% 42%)` }}
      >
        {player.name
          .replace(/[^\p{L}\p{N}]/gu, "")
          .slice(0, 1)
          .toUpperCase() || "?"}
        {player.online ? (
          <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-surface bg-primary" />
        ) : null}
      </span>
      <span className="truncate">{player.name}</span>
    </span>
  );
  return player.pubkey ? (
    <ExternalLink href={links.profile(app, player.pubkey)} className="min-w-0 hover:text-fg">
      {face}
    </ExternalLink>
  ) : (
    face
  );
}

function LiveDot({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-fg-faint">
      <span
        className={cn("inline-block h-2 w-2 rounded-full", on ? "bg-primary" : "bg-fg-faint")}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function GameTile({ game }: { game: DuelGame }) {
  const t = useT(arcadeNs);
  const [open, setOpen] = useState(false);
  return (
    <li
      className="group flex flex-col gap-3 rounded-card border border-border bg-surface p-4 transition-colors hover:border-primary/60"
      data-testid={`duel-game-${game.slug}`}
    >
      <div className="flex items-start gap-3">
        <DuelIcon game={game} size={56} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate font-semibold text-fg">{game.name}</h3>
          <p className="truncate text-xs text-fg-faint">
            {game.author ? t("duels.by", { name: game.author.name }) : null}
            {game.version ? ` · v${game.version}` : null}
            {game.license ? ` · ${game.license}` : null}
          </p>
        </div>
        <ExternalLink
          href={game.url}
          className="shrink-0 rounded-full border border-primary bg-primary-soft px-3 py-1 text-xs font-semibold text-primary hover:underline"
        >
          {t("duels.play")}
        </ExternalLink>
      </div>
      <p className="line-clamp-3 text-sm text-fg-muted">{game.description}</p>
      {game.instructions ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="text-xs font-medium text-accent hover:underline"
          >
            {open ? t("game.hideHowToPlay") : t("game.howToPlay")}
          </button>
          {open ? <p className="mt-1 text-sm text-fg-muted">{game.instructions}</p> : null}
        </div>
      ) : null}
    </li>
  );
}

function RoomLine({ room, app, action }: { room: DuelRoom; app: string; action: string }) {
  const t = useT(arcadeNs);
  const tone = room.phase === "live" ? "primary" : room.phase === "open" ? "info" : "neutral";
  return (
    <li className="flex flex-col gap-1 py-2 text-xs">
      <span className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-fg">{room.games[0] ?? t("rooms.table")}</span>
        <ExternalLink
          href={room.url}
          className="shrink-0 font-semibold text-accent hover:underline"
        >
          {action}
        </ExternalLink>
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-fg-muted">
        {room.host ? <PlayerBadge player={room.host} app={app} /> : null}
        {room.guest ? (
          <>
            <span className="text-fg-faint">{t("rooms.versusSeparator").trim()}</span>
            <PlayerBadge player={room.guest} app={app} />
          </>
        ) : null}
      </span>
      <span className="flex flex-wrap items-center gap-x-2 text-fg-faint">
        {room.phase !== "open" ? (
          <Badge tone={tone}>{t(`duels.recent.phases.${room.phase}`)}</Badge>
        ) : (
          <span className={room.host?.online ? "text-primary" : undefined}>
            {room.host?.online ? t("duels.open.hostOnline") : t("duels.open.hostAway")}
          </span>
        )}
        {room.stake > 0n ? <span>{t("duels.stake", { amount: txch(room.stake) })}</span> : null}
        {room.updatedAt ? <span>{formatAge(room.updatedAt)}</span> : null}
      </span>
    </li>
  );
}

function RoomsCard({ provider }: { provider: GamingProvider }) {
  const t = useT(arcadeNs);
  const rooms = useDuelRooms(provider);
  const view = rooms.data;
  return (
    <Card>
      <CardHeader
        title={t("duels.open.title")}
        action={
          <LiveDot
            on={!!view && !rooms.isError}
            label={
              view ? t("duels.live", { seconds: DUELS_REFRESH_MS / 1000 }) : t("duels.loading")
            }
          />
        }
      />
      <CardBody className="flex flex-col gap-3">
        {rooms.isError && !view ? (
          <p className="text-xs text-warning">{t("duels.error", { name: provider.name })}</p>
        ) : !view ? (
          <Skeleton className="h-24" />
        ) : (
          <>
            {view.open.items.length === 0 ? (
              <p className="text-xs text-fg-faint">{t("duels.open.none")}</p>
            ) : (
              <ul
                aria-label={t("duels.open.title")}
                className="flex flex-col divide-y divide-border/60"
                data-testid="duels-open"
              >
                {view.open.items.slice(0, 8).map((room) => (
                  <RoomLine
                    key={room.id}
                    room={room}
                    app={provider.appUrl}
                    action={t("duels.open.join")}
                  />
                ))}
              </ul>
            )}
            <details className="group rounded-sm border border-border bg-bg" open>
              <summary className="flex cursor-pointer select-none items-center justify-between px-2.5 py-1.5 text-xs font-medium text-fg">
                {t("duels.recent.title")}
                <span
                  aria-hidden="true"
                  className="text-fg-faint transition-transform group-open:rotate-180"
                >
                  ⌄
                </span>
              </summary>
              {view.recent.items.length === 0 ? (
                <p className="px-2.5 pb-2 text-xs text-fg-faint">{t("duels.recent.none")}</p>
              ) : (
                <ul
                  aria-label={t("duels.recent.title")}
                  className="flex flex-col divide-y divide-border/60 px-2.5"
                  data-testid="duels-recent"
                >
                  {view.recent.items.slice(0, 10).map((room) => (
                    <RoomLine
                      key={room.id}
                      room={room}
                      app={provider.appUrl}
                      action={
                        room.phase === "live" ? t("duels.recent.watch") : t("duels.recent.view")
                      }
                    />
                  ))}
                </ul>
              )}
            </details>
          </>
        )}
        <div className="flex flex-wrap gap-3 text-[11px]">
          <ExternalLink
            href={links.newRoom(provider.appUrl)}
            className="text-accent hover:underline"
          >
            {t("duels.openRoom")}
          </ExternalLink>
          <ExternalLink href={links.rooms(provider.appUrl)} className="text-accent hover:underline">
            {t("duels.allRooms")}
          </ExternalLink>
        </div>
      </CardBody>
    </Card>
  );
}

function LeaderboardCard({ provider }: { provider: GamingProvider }) {
  const t = useT(arcadeNs);
  const board = useDuelLeaderboard(provider);
  const rows: LeaderboardRow[] = board.data?.items ?? [];
  return (
    <Card>
      <CardHeader title={t("duels.leaderboard.title")} />
      <CardBody className="flex flex-col gap-2">
        {board.isError && !board.data ? (
          <p className="text-xs text-warning">{t("duels.error", { name: provider.name })}</p>
        ) : !board.data ? (
          <Skeleton className="h-40" />
        ) : (
          <table className="w-full text-xs" data-testid="duels-leaderboard">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-fg-faint">
                <th scope="col" className="w-6 py-1 font-medium">
                  {t("duels.leaderboard.rank")}
                </th>
                <th scope="col" className="py-1 font-medium">
                  {t("duels.leaderboard.player")}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t("duels.leaderboard.record")}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {t("duels.leaderboard.winRate")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr key={row.pubkey}>
                  <td
                    className={cn(
                      "py-1.5 tabular text-fg-faint",
                      row.rank <= 3 && "font-semibold text-primary"
                    )}
                  >
                    {row.rank}
                  </td>
                  <td className="max-w-0 py-1.5 text-fg">
                    <PlayerBadge
                      player={{ name: row.name, pubkey: row.pubkey, online: false }}
                      app={provider.appUrl}
                    />
                  </td>
                  <td className="py-1.5 text-right tabular text-fg-muted">
                    {row.wins}–{row.losses}–{row.draws}
                  </td>
                  <td className="py-1.5 text-right tabular text-fg">
                    {formatPercent(row.winRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <ExternalLink
          href={links.leaderboard(provider.appUrl)}
          className="text-[11px] text-accent hover:underline"
        >
          {t("duels.leaderboard.full")}
        </ExternalLink>
      </CardBody>
    </Card>
  );
}

/**
 * Testnet gaming, live from the provider's tracker: a hero with the numbers that say whether
 * anyone is playing, the game shelf, rooms to join or watch and the leaderboard. Every action
 * opens the provider's own app, which holds the wallet connection and the state channel.
 */
export function DuelsView({ provider }: { provider: GamingProvider }) {
  const t = useT(arcadeNs);
  const games = useDuelGames(provider);
  const rooms = useDuelRooms(provider);
  const board = useDuelLeaderboard(provider);
  const liveCount = rooms.data?.recent.items.filter((r) => r.phase === "live").length;
  const dash = "—";

  return (
    <div className="flex flex-col gap-5" data-testid="duels">
      <section className="relative overflow-hidden rounded-card border border-border bg-surface p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(60%_120%_at_100%_0%,var(--primary-soft),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {t("duels.eyebrow", { name: provider.name })}
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {t("duels.title")}
            </h2>
            <p className="max-w-3xl text-sm text-fg-muted">{t("duels.lead")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExternalLink
              href={links.newRoom(provider.appUrl)}
              className="inline-flex h-9 items-center rounded-sm bg-primary px-3.5 text-sm font-semibold text-primary-fg hover:bg-primary-strong"
            >
              {t("duels.openRoom")}
            </ExternalLink>
            <ExternalLink
              href={links.rooms(provider.appUrl)}
              className="inline-flex h-9 items-center rounded-sm border border-border bg-surface-2 px-3.5 text-sm font-medium text-fg hover:bg-surface-hover"
            >
              {t("duels.allRooms")}
            </ExternalLink>
            <ExternalLink
              href={FAUCET_URL}
              className="inline-flex h-9 items-center rounded-sm px-3 text-sm font-medium text-accent hover:underline"
            >
              {t("duels.faucet")}
            </ExternalLink>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label={t("duels.stats.games")}
              value={games.data ? formatNumber(games.data.items.length) : dash}
            />
            <StatTile
              label={t("duels.stats.open")}
              value={rooms.data ? formatNumber(rooms.data.open.total) : dash}
              tone={rooms.data?.open.total ? "primary" : "default"}
            />
            <StatTile
              label={t("duels.stats.live")}
              value={liveCount !== undefined ? formatNumber(liveCount) : dash}
              sub={
                rooms.data
                  ? t("duels.livePlayers", { count: rooms.data.recent.items.length })
                  : undefined
              }
            />
            <StatTile
              label={t("duels.stats.rooms")}
              value={rooms.data ? formatNumber(rooms.data.recent.total) : dash}
            />
            <StatTile
              label={t("duels.stats.players")}
              value={board.data ? formatNumber(board.data.total) : dash}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{t("games")}</h2>
          {games.isError && !games.data ? (
            <p className="text-sm text-warning">{t("duels.error", { name: provider.name })}</p>
          ) : !games.data ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-36" />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label={t("games")}>
              {games.data.items.map((g) => (
                <GameTile key={g.id} game={g} />
              ))}
            </ul>
          )}
        </section>
        <div className="flex flex-col gap-5">
          <RoomsCard provider={provider} />
          <LeaderboardCard provider={provider} />
        </div>
      </div>

      <p className="text-xs text-fg-faint">
        {t.rich("duels.disclaimer", {
          name: provider.name,
          link: (c) => (
            <ExternalLink href={provider.appUrl} className="text-accent hover:underline">
              {c}
            </ExternalLink>
          ),
        })}
      </p>
    </div>
  );
}
