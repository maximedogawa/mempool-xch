"use client";

import { useState } from "react";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import type { CoinRecord } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Amount,
  Button,
  Card,
  CardBody,
  CardHeader,
  Hash,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";

const PAGE = 100;

function CoinTable({ rows, emptyText }: { rows: CoinRecord[]; emptyText: string }) {
  const { networkConfig } = useSettings();
  const [limit, setLimit] = useState(PAGE);
  if (rows.length === 0)
    return <p className="py-4 text-center text-sm text-fg-faint">{emptyText}</p>;
  const shown = rows.slice(0, limit);
  return (
    <>
      <Table>
        <thead>
          <tr>
            <Th>Coin id</Th>
            <Th className="hidden sm:table-cell">Address</Th>
            <Th className="text-right">Amount</Th>
            <Th className="hidden text-right md:table-cell">Status</Th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <Tr key={r.name}>
              <Td>
                <Hash value={r.name} href={routes.coin(r.name)} />
              </Td>
              <Td className="hidden sm:table-cell">
                <Hash
                  value={puzzleHashToAddress(r.coin.puzzleHash, networkConfig.addressPrefix)}
                  href={routes.address(
                    puzzleHashToAddress(r.coin.puzzleHash, networkConfig.addressPrefix)
                  )}
                  head={10}
                  tail={6}
                />
              </Td>
              <Td className="text-right">
                <Amount mojos={r.coin.amount} />
              </Td>
              <Td className="hidden text-right text-xs text-fg-faint md:table-cell">
                {r.coinbase ? "reward · " : ""}
                {r.spent ? `spent at ${r.spentBlockIndex.toLocaleString("en-US")}` : "unspent"}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      {rows.length > shown.length ? (
        <div className="mt-3 flex items-center justify-between text-xs text-fg-faint">
          <span>
            Showing {shown.length} of {rows.length}
          </span>
          <Button size="sm" onClick={() => setLimit((l) => l + PAGE)}>
            Show more
          </Button>
        </div>
      ) : null}
    </>
  );
}

export function BlockCoins({
  data,
  loading,
}: {
  data: { additions: CoinRecord[]; removals: CoinRecord[] } | undefined;
  loading: boolean;
}) {
  const [tab, setTab] = useState<"additions" | "removals">("additions");
  return (
    <Card>
      <CardHeader
        title="Coins"
        action={
          <div
            role="tablist"
            aria-label="Coin lists"
            className="inline-flex rounded-sm border border-border p-0.5"
          >
            {(["additions", "removals"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium capitalize",
                  tab === t ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {t}
                {data ? <span className="tabular ml-1 text-fg-faint">{data[t].length}</span> : null}
              </button>
            ))}
          </div>
        }
      />
      <CardBody>
        {loading || !data ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : tab === "additions" ? (
          <CoinTable rows={data.additions} emptyText="No coins were created in this block." />
        ) : (
          <CoinTable rows={data.removals} emptyText="No coins were spent in this block." />
        )}
      </CardBody>
    </Card>
  );
}
