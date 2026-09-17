"use client";

import { Eye, EyeOff } from "lucide-react";
import type { WatchKind } from "@/shared/lib/watchlist/store";
import { Button } from "@/shared/ui";
import { useWatchlist } from "./useWatchlist";

/** Add/remove the current address or transaction from the local watchlist. */
export function WatchButton({ kind, id, label }: { kind: WatchKind; id: string; label: string }) {
  const { has, add, remove } = useWatchlist();
  const watching = has(kind, id);
  return (
    <Button
      size="sm"
      variant={watching ? "primary" : "secondary"}
      aria-pressed={watching}
      onClick={() => (watching ? remove(kind, id) : add({ kind, id, label }))}
    >
      {watching ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
      {watching ? "Watching" : "Watch"}
    </Button>
  );
}
