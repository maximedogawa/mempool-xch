"use client";

import Link from "next/link";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import type { NftEvent, NftEventKind } from "@/shared/lib/nft/mintgarden";
import { Badge } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { formatXchDecimal } from "./format";

const KIND_LABEL: Record<NftEventKind, string> = {
  mint: "Mint",
  transfer: "Transfer",
  trade: "Sale",
  burn: "Burn",
};
const KIND_TONE: Record<NftEventKind, "primary" | "info" | "xch" | "danger"> = {
  mint: "primary",
  transfer: "info",
  trade: "xch",
  burn: "danger",
};

export function NftEventRow({ event }: { event: NftEvent }) {
  const nftId = launcherIdToNftId(event.nftId);
  return (
    <li className="group flex items-center gap-3 py-2.5 text-sm">
      <Link
        href={routes.nft(nftId)}
        className="shrink-0 overflow-hidden rounded-lg ring-1 ring-border transition-all group-hover:ring-primary/50"
      >
        <AssetImage
          urls={event.thumbnailUrl ? [event.thumbnailUrl] : []}
          alt=""
          className="h-11 w-11 transition-transform duration-200 group-hover:scale-105"
          rounded=""
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={routes.nft(nftId)}
          className="truncate font-medium text-fg group-hover:text-accent"
        >
          {event.nftName ?? nftId}
        </Link>
        <span className="truncate text-xs text-fg-faint">
          {event.collectionName ?? "Uncategorised"}
          {event.blockHeight ? (
            <>
              {" "}
              ·{" "}
              <Link href={routes.block(event.blockHeight)} className="hover:underline">
                block {event.blockHeight}
              </Link>
            </>
          ) : null}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <Badge tone={KIND_TONE[event.kind]}>{KIND_LABEL[event.kind]}</Badge>
        <span className="text-xs text-fg-faint">
          {event.kind === "trade" && event.xchPrice !== null
            ? `${formatXchDecimal(event.xchPrice)} · `
            : ""}
          {event.timestamp ? formatAge(event.timestamp) : ""}
        </span>
      </div>
    </li>
  );
}
