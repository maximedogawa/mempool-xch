"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { buildCoinFlow, type CoinFlowGroup } from "@/shared/lib/blocks/coinFlow";
import { routes } from "@/shared/lib/routes";
import type { CoinRecord } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Amount, Badge, Button, Card, CardBody, CardHeader, Hash, Skeleton } from "@/shared/ui";

const GROUPS_PAGE = 25;
const CHILDREN_SHOWN = 10;

function CoinLine({ record, ephemeral }: { record: CoinRecord; ephemeral?: boolean }) {
  const { networkConfig } = useSettings();
  const address = puzzleHashToAddress(record.coin.puzzleHash, networkConfig.addressPrefix);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2">
        <Hash value={record.name} href={routes.coin(record.name)} head={8} tail={6} />
        <Hash
          value={address}
          href={routes.address(address)}
          head={8}
          tail={6}
          className="text-xs"
        />
        {ephemeral ? <Badge tone="neutral">spent in this block</Badge> : null}
      </span>
      <Amount mojos={record.coin.amount} className="tabular" />
    </div>
  );
}

function Group({ group, ephemeral }: { group: CoinFlowGroup; ephemeral: ReadonlySet<string> }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? group.children : group.children.slice(0, CHILDREN_SHOWN);
  const hidden = group.children.length - shown.length;
  return (
    <li className="grid grid-cols-1 gap-2 border-b border-border/60 py-3 md:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] md:gap-3">
      <div className="text-sm">
        <span className="sr-only">Spent coin </span>
        <CoinLine record={group.parent} ephemeral={ephemeral.has(group.parent.name)} />
      </div>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="hidden self-start text-fg-faint md:mt-0.5 md:block"
      />
      <div className="flex flex-col gap-1 text-sm">
        {group.children.length === 0 ? (
          <span className="text-fg-faint">Created no coins</span>
        ) : (
          <ul aria-label={`${group.children.length} coins created`} className="flex flex-col gap-1">
            {shown.map((child) => (
              <li key={child.name}>
                <CoinLine record={child} ephemeral={ephemeral.has(child.name)} />
              </li>
            ))}
          </ul>
        )}
        {hidden > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            onClick={() => setExpanded(true)}
          >
            Show {hidden} more
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/** Created coins linked to the spent coins they came from. */
export function BlockCoinFlow({
  data,
  loading,
}: {
  data: { additions: CoinRecord[]; removals: CoinRecord[] } | undefined;
  loading: boolean;
}) {
  const flow = useMemo(() => (data ? buildCoinFlow(data.additions, data.removals) : null), [data]);
  const [limit, setLimit] = useState(GROUPS_PAGE);

  return (
    <Card>
      <CardHeader
        title="Flow"
        action={
          flow ? (
            <span className="tabular text-xs text-fg-faint">
              {flow.groups.length} spent · {data!.additions.length} created
            </span>
          ) : null
        }
      />
      <CardBody className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">
          Each coin spent in this block, and the coins its spend created. A new coin records its
          parent&apos;s coin id, so every link here is exact.
        </p>
        {loading || !flow ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : flow.groups.length === 0 && flow.rewards.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-faint">
            No coins were spent or created in this block.
          </p>
        ) : (
          <>
            {flow.rewards.length > 0 ? (
              <section
                aria-label="Reward coins"
                className="flex flex-col gap-1 rounded-sm border border-border bg-bg p-3 text-sm"
              >
                <h3 className="text-xs font-medium uppercase tracking-wider text-fg-muted">
                  Rewards paid out ({flow.rewards.length})
                </h3>
                <p className="text-xs text-fg-faint">
                  Farmer and pool rewards for earlier blocks. They are created from nothing, so they
                  have no spent parent.
                </p>
                <ul className="flex flex-col gap-1">
                  {flow.rewards.map((r) => (
                    <li key={r.name}>
                      <CoinLine record={r} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {flow.groups.length > 0 ? (
              <ul aria-label="Spent coins and the coins they created" className="flex flex-col">
                {flow.groups.slice(0, limit).map((group) => (
                  <Group key={group.parent.name} group={group} ephemeral={flow.ephemeral} />
                ))}
              </ul>
            ) : null}
            {flow.groups.length > limit ? (
              <div className="flex items-center justify-between text-xs text-fg-faint">
                <span>
                  Showing {limit} of {flow.groups.length} spent coins
                </span>
                <Button size="sm" onClick={() => setLimit((l) => l + GROUPS_PAGE)}>
                  Show more
                </Button>
              </div>
            ) : null}
            {flow.unlinked.length > 0 ? (
              <p className="text-xs text-warning">
                {flow.unlinked.length} created coins have no parent among this block&apos;s spent
                coins.
              </p>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
