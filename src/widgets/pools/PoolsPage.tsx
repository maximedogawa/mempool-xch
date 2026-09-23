"use client";

import { useState } from "react";
import { addressToPuzzleHash, puzzleHashToAddress } from "@/shared/lib/chia/address";
import { useT } from "@/shared/i18n/useT";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import type { PoolGroup } from "@/shared/lib/pools/share";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Hash,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { groupLabel, poolColor, PoolShareBar } from "./PoolShareBar";
import { usePoolShare } from "./usePoolShare";
import poolsNs from "@/shared/i18n/messages/en/pools";

/** Rows shown before "Show all": the long tail is hundreds of one-block solo farmers. */
const COLLAPSED_ROWS = 25;
/** Payout addresses listed per pool before "+N more". */
const COLLAPSED_PAYOUTS = 3;

/** Matches a group by pool name, label, claim target or payout address (hex or bech32). */
function matches(group: PoolGroup, needle: string, label: string): boolean {
  if (needle === "") return true;
  if (label.toLowerCase().includes(needle)) return true;
  const hash = addressToPuzzleHash(needle) ?? needle.replace(/^0x/, "");
  // A couple of hex characters would match nearly every hash.
  if (!/^[0-9a-f]{6,64}$/.test(hash)) return false;
  return (
    (group.claimTarget?.includes(hash) ?? false) ||
    group.payouts.some((p) => p.payoutHash.includes(hash))
  );
}

export function PoolsPage() {
  const t = useT(poolsNs);
  const { share, windowStart, windowEnd, canResolveClaims, resolving, error } = usePoolShare();
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const needle = search.trim().toLowerCase();
  const matching = share ? share.groups.filter((g) => matches(g, needle, groupLabel(g, t))) : [];
  const visible = showAll || needle !== "" ? matching : matching.slice(0, COLLAPSED_ROWS);
  const rankByKey = new Map(share ? share.groups.map((g, rank) => [g.key, rank] as const) : []);
  const namedPools = share ? share.groups.filter((g) => g.kind === "pool").length : 0;
  const largest = share?.groups[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("stats.blocks")}
          value={share ? formatNumber(share.totalBlocks) : "…"}
          sub={
            windowStart !== null && windowEnd !== null
              ? t("stats.heights", {
                  start: formatNumber(windowStart),
                  end: formatNumber(windowEnd),
                })
              : undefined
          }
        />
        <StatTile
          label={t("stats.largest")}
          value={largest ? formatPercent(largest.share, 1) : "…"}
          sub={largest ? groupLabel(largest, t) : undefined}
          hint={t("stats.largestHint")}
        />
        <StatTile
          label={t("stats.named")}
          value={share ? formatPercent(share.namedShare, 1) : "…"}
          sub={
            share
              ? t("stats.namedSub", {
                  blocks: formatNumber(share.namedBlocks),
                  pools: namedPools,
                })
              : undefined
          }
          hint={t("stats.namedHint")}
        />
        <StatTile
          label={t("stats.payouts")}
          value={share ? formatNumber(share.payoutCount) : "…"}
          sub={
            share ? t("stats.payoutsSub", { count: formatNumber(share.groups.length) }) : undefined
          }
          hint={t("stats.payoutsHint")}
        />
      </div>

      <Card>
        <CardHeader
          title={t("share.title")}
          action={
            share ? (
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("share.search")}
                aria-label={t("share.search")}
                className="h-8 w-44 rounded-sm border border-border bg-surface px-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none sm:w-64"
              />
            ) : null
          }
        />
        <CardBody className="flex flex-col gap-4">
          {error ? (
            <EmptyState tone="danger" title={t("share.loadError")} description={error.message} />
          ) : !share ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-full" />
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : (
            <>
              <PoolShareBar share={share} />
              {!canResolveClaims ? (
                <p className="text-xs text-fg-faint">{t("share.noClaims")}</p>
              ) : resolving > 0 ? (
                <p role="status" className="text-xs text-fg-muted">
                  {t("share.resolving", { count: resolving })}
                </p>
              ) : null}
              <div role="region" aria-label={t("share.title")}>
                {matching.length === 0 ? (
                  <p className="py-6 text-center text-sm text-fg-faint">
                    {t("share.noMatch", { search })}
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>{t("share.colPool")}</Th>
                        <Th>{t("share.colPayouts")}</Th>
                        <Th className="text-right">{t("share.colBlocks")}</Th>
                        <Th className="text-right">{t("share.colShare")}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((group) => (
                        <PoolRow
                          key={group.key}
                          group={group}
                          color={poolColor(rankByKey.get(group.key) ?? Infinity)}
                        />
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
              {needle === "" && matching.length > COLLAPSED_ROWS ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="self-center"
                  onClick={() => setShowAll((v) => !v)}
                  aria-expanded={showAll}
                >
                  {showAll
                    ? t("share.showTop", { count: COLLAPSED_ROWS })
                    : t("share.showAll", { count: formatNumber(matching.length) })}
                </Button>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      <p className="max-w-3xl text-xs text-fg-faint">
        {t.rich("footnote", { code: (c) => <span className="mono">{c}</span> })}
      </p>
    </div>
  );
}

function PoolRow({ group, color }: { group: PoolGroup; color: string }) {
  const t = useT(poolsNs);
  const { networkConfig } = useSettings();
  const [expanded, setExpanded] = useState(false);
  const address = (hash: string) => puzzleHashToAddress(hash, networkConfig.addressPrefix);
  const payouts = expanded ? group.payouts : group.payouts.slice(0, COLLAPSED_PAYOUTS);
  const hidden = group.payouts.length - COLLAPSED_PAYOUTS;

  return (
    <Tr>
      <Td className="align-top">
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex flex-wrap items-center gap-1.5 font-medium text-fg">
              {group.entry ? (
                <>
                  <a
                    href={group.entry.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-accent hover:underline"
                  >
                    {group.entry.name}
                  </a>
                  <Tooltip text={group.entry.source} />
                </>
              ) : (
                <span className="text-fg-muted">{groupLabel(group, t)}</span>
              )}
              {group.bothShares ? (
                <>
                  <Badge>{t("row.bothShares")}</Badge>
                  <Tooltip text={t("row.bothSharesHint")} />
                </>
              ) : null}
            </span>
            {group.claimTarget ? (
              <span className="text-xs text-fg-faint">
                {t.rich("row.claimsTo", {
                  hash: () => (
                    <Hash
                      value={address(group.claimTarget!)}
                      href={routes.address(address(group.claimTarget!))}
                      head={8}
                      tail={6}
                    />
                  ),
                })}
              </span>
            ) : null}
          </div>
        </div>
      </Td>
      <Td className="align-top">
        <ul
          className={
            expanded ? "flex max-h-72 flex-col gap-1 overflow-y-auto pr-2" : "flex flex-col gap-1"
          }
        >
          {payouts.map((p) => (
            <li key={p.payoutHash} className="flex items-center gap-2 text-xs">
              <Hash
                value={address(p.payoutHash)}
                href={routes.address(address(p.payoutHash))}
                head={10}
                tail={6}
                copy
              />
              {group.payouts.length > 1 ? (
                <span className="tabular text-fg-faint">{formatNumber(p.blocks)}</span>
              ) : null}
            </li>
          ))}
        </ul>
        {hidden > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 -ml-2"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? t("row.showFewer") : t("row.more", { count: formatNumber(hidden) })}
          </Button>
        ) : null}
      </Td>
      <Td className="tabular text-right align-top text-fg-muted">{formatNumber(group.blocks)}</Td>
      <Td className="tabular text-right align-top font-medium text-fg">
        {formatPercent(group.share, 2)}
      </Td>
    </Tr>
  );
}
