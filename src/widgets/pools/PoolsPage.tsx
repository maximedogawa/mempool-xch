"use client";

import { useState } from "react";
import { addressToPuzzleHash, puzzleHashToAddress } from "@/shared/lib/chia/address";
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

/** Rows shown before "Show all": the long tail is hundreds of one-block solo farmers. */
const COLLAPSED_ROWS = 25;
/** Payout addresses listed per pool before "+N more". */
const COLLAPSED_PAYOUTS = 3;

const BOTH_SHARES_HINT =
  "The pool reward (7/8) and the farmer reward (1/8) go to the same address on every block, so this is not a PlotNFT of the official pool protocol: a solo farmer, or an operator with its own protocol.";

/** Matches a group by pool name, label, claim target or payout address (hex or bech32). */
function matches(group: PoolGroup, needle: string): boolean {
  if (needle === "") return true;
  if (groupLabel(group).toLowerCase().includes(needle)) return true;
  const hash = addressToPuzzleHash(needle) ?? needle.replace(/^0x/, "");
  // A couple of hex characters would match nearly every hash.
  if (!/^[0-9a-f]{6,64}$/.test(hash)) return false;
  return (
    (group.claimTarget?.includes(hash) ?? false) ||
    group.payouts.some((p) => p.payoutHash.includes(hash))
  );
}

export function PoolsPage() {
  const { share, windowStart, windowEnd, canResolveClaims, resolving, error } = usePoolShare();
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const needle = search.trim().toLowerCase();
  const matching = share ? share.groups.filter((g) => matches(g, needle)) : [];
  const visible = showAll || needle !== "" ? matching : matching.slice(0, COLLAPSED_ROWS);
  const rankByKey = new Map(share ? share.groups.map((g, rank) => [g.key, rank] as const) : []);
  const namedPools = share ? share.groups.filter((g) => g.kind === "pool").length : 0;
  const largest = share?.groups[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Pools</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Blocks"
          value={share ? formatNumber(share.totalBlocks) : "…"}
          sub={
            windowStart !== null && windowEnd !== null
              ? `heights ${formatNumber(windowStart)} – ${formatNumber(windowEnd)}`
              : undefined
          }
        />
        <StatTile
          label="Largest"
          value={largest ? formatPercent(largest.share, 1) : "…"}
          sub={largest ? groupLabel(largest) : undefined}
          hint="The biggest single group in the window."
        />
        <StatTile
          label="Named pools"
          value={share ? formatPercent(share.namedShare, 1) : "…"}
          sub={
            share ? `${formatNumber(share.namedBlocks)} blocks · ${namedPools} pools` : undefined
          }
          hint="Share won by pools in the registry, each confirmed from the pool's own pool_info endpoint or another recorded source."
        />
        <StatTile
          label="Payout addresses"
          value={share ? formatNumber(share.payoutCount) : "…"}
          sub={share ? `in ${formatNumber(share.groups.length)} groups` : undefined}
          hint="Distinct pool payout addresses that won a block in the window. Every PlotNFT farmer has their own, so a pool owns many."
        />
      </div>

      <Card>
        <CardHeader
          title="Share by pool"
          action={
            share ? (
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pool or address"
                aria-label="Search pool or address"
                className="h-8 w-44 rounded-sm border border-border bg-surface px-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none sm:w-64"
              />
            ) : null
          }
        />
        <CardBody className="flex flex-col gap-4">
          {error ? (
            <EmptyState
              tone="danger"
              title="Could not load pool share"
              description={error.message}
            />
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
                <p className="text-xs text-fg-faint">
                  Reward claims come from Coinset&apos;s indexed API, which a custom node does not
                  offer: PlotNFT farmers are listed one by one here instead of under their pool.
                </p>
              ) : resolving > 0 ? (
                <p role="status" className="text-xs text-fg-muted">
                  Checking where {formatNumber(resolving)} payout{" "}
                  {resolving === 1 ? "address has its" : "addresses have their"} rewards claimed;
                  pools grow as results arrive. Your browser remembers them for the next visit.
                </p>
              ) : null}
              <div role="region" aria-label="Share by pool">
                {matching.length === 0 ? (
                  <p className="py-6 text-center text-sm text-fg-faint">
                    No pool or address matches &quot;{search}&quot;.
                  </p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Pool</Th>
                        <Th>Payout addresses</Th>
                        <Th className="text-right">Blocks</Th>
                        <Th className="text-right">Share</Th>
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
                    ? `Show the top ${COLLAPSED_ROWS}`
                    : `Show all ${formatNumber(matching.length)} rows`}
                </Button>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      <p className="max-w-3xl text-xs text-fg-faint">
        A block&apos;s payout address and the claim that empties it are both on chain, so the
        grouping is exact; only the names come from a registry, matched against the target address a
        pool publishes at its <span className="mono">pool_info</span> endpoint. An address whose
        rewards were never claimed (a fresh PlotNFT, or a pool that has not collected yet) stays
        &quot;Unknown&quot; until it is. Know a pool that is missing? Add a sourced entry to{" "}
        <span className="mono">src/shared/lib/pools/registry.json</span> (see the wiki&apos;s
        contribution note).
      </p>
    </div>
  );
}

function PoolRow({ group, color }: { group: PoolGroup; color: string }) {
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
                <span className="text-fg-muted">{groupLabel(group)}</span>
              )}
              {group.bothShares ? (
                <>
                  <Badge>both shares</Badge>
                  <Tooltip text={BOTH_SHARES_HINT} />
                </>
              ) : null}
            </span>
            {group.claimTarget ? (
              <span className="text-xs text-fg-faint">
                claims to{" "}
                <Hash
                  value={address(group.claimTarget)}
                  href={routes.address(address(group.claimTarget))}
                  head={8}
                  tail={6}
                />
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
            {expanded ? "Show fewer" : `+${formatNumber(hidden)} more`}
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
