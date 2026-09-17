"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { NftEventKind } from "@/shared/lib/nft/mintgarden";
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from "@/shared/ui";
import { NftEventRow } from "./NftEventRow";
import { useNftEvents } from "./useNftSection";

const KINDS: readonly { id: NftEventKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mint", label: "Mints" },
  { id: "transfer", label: "Transfers" },
  { id: "trade", label: "Sales" },
  { id: "burn", label: "Burns" },
];

export function NftActivityPage() {
  const [kind, setKind] = useState<NftEventKind | "all">("all");
  const query = useNftEvents(kind === "all" ? undefined : [kind]);
  const events = query.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">NFT activity</h1>
        <p className="text-sm text-fg-muted">Mints, transfers, sales and burns across every collection MintGarden indexes, newest first.</p>
      </header>

      <Card>
        <CardHeader title="Activity" />
        <CardBody className="flex flex-col gap-3">
          <div role="radiogroup" aria-label="Kind" className="flex flex-wrap gap-1">
            {KINDS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={kind === opt.id}
                onClick={() => setKind(opt.id)}
                className={cn(
                  "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
                  kind === opt.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-bg text-fg-muted hover:text-fg"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {query.error ? (
            <EmptyState tone="danger" title="Could not load activity" description="MintGarden did not answer." />
          ) : query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">No events.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((e) => (
                <NftEventRow key={`${e.nftId}-${e.blockHeight}-${e.kind}`} event={e} />
              ))}
            </ul>
          )}

          {query.hasNextPage ? (
            <Button size="sm" className="self-center" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
