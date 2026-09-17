"use client";

import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { NftEventRow } from "./NftEventRow";
import { useNftEvents } from "./useNftSection";

export function NftMintsPage() {
  const query = useNftEvents(["mint"]);
  const events = query.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">New mints</h1>
          <Tooltip text="NFTs freshly minted across every collection MintGarden indexes, newest first." placement="bottom" />
        </div>
      </header>

      <Card>
        <CardHeader title="Mints" />
        <CardBody className="flex flex-col gap-3">
          {query.error ? (
            <EmptyState tone="danger" title="Could not load mints" description="MintGarden did not answer." />
          ) : query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">No recent mints.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((e) => (
                <NftEventRow key={`${e.nftId}-${e.blockHeight}-mint`} event={e} />
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
