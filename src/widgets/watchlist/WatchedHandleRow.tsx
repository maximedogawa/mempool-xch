"use client";

import { AtSign, Clock3, Eye, Wallet } from "lucide-react";
import Link from "next/link";
import { describeExpiry } from "@/shared/lib/handles/expiry";
import { formatHandle } from "@/shared/lib/handles/xchandles";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { routes } from "@/shared/lib/routes";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Hash } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { useHandle } from "@/widgets/handle/useHandle";
import { RemoveWatch, WatchStatus } from "./WatchlistParts";

/**
 * A watched XCHandles handle. What matters about a name is where it points today and how long
 * it has left, so the row carries the resolved address and the countdown, in the warning tone
 * once the registry's last 30 days are reached.
 */
export function WatchedHandleRow({ item, onRemove }: { item: WatchItem; onRemove: () => void }) {
  const { networkConfig } = useSettings();
  // The id is the registry's bare key; the @ is how it is written back out.
  const handle = item.id;
  const shown = formatHandle(handle);
  const { record, art, isLoading, available } = useHandle(handle);
  const status = record?.status;
  const address = record?.p2PuzzleHash
    ? puzzleHashToAddress(record.p2PuzzleHash, networkConfig.addressPrefix)
    : (art?.address ?? null);
  const expiration = record?.expiration ?? null;
  const expiry = expiration !== null ? describeExpiry(expiration) : null;
  const flagged = expiry?.soon || expiry?.expired || status === "expired";
  return (
    <li className="min-w-0 rounded-xl border border-border bg-bg/50 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        {art?.thumbnailUrl ? (
          <AssetImage
            urls={[art.thumbnailUrl]}
            alt={`Name NFT of ${shown}`}
            className="h-10 w-10 shrink-0"
            rounded="rounded-xl"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
            <AtSign size={18} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              Handle
            </span>
            <WatchStatus pending={!!flagged}>
              <Eye size={11} aria-hidden="true" />
              {!available
                ? "Mainnet only"
                : isLoading
                  ? "Checking…"
                  : status === "unknown"
                    ? "Not registered"
                    : status === "expired"
                      ? "Expired"
                      : status === "syncing"
                        ? "Registry syncing"
                        : status === "unavailable"
                          ? "Registry unreachable"
                          : "Registered"}
            </WatchStatus>
          </div>
          <Link
            href={routes.handle(handle)}
            className="mono block truncate text-sm font-semibold hover:text-primary"
          >
            {shown}
          </Link>
        </div>
        <RemoveWatch label={shown} onRemove={onRemove} />
      </div>
      <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
        {!available ? (
          <p className="text-xs text-fg-muted">XCHandles is a mainnet registry.</p>
        ) : (
          <>
            {address ? (
              <p className="flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
                <Wallet size={13} aria-hidden="true" />
                <span className="shrink-0">Resolves to</span>
                <Hash value={address} href={routes.address(address)} head={10} tail={6} />
              </p>
            ) : (
              <p className="text-xs text-fg-faint">
                {status === "unknown"
                  ? "Nobody has registered this handle."
                  : isLoading
                    ? "Resolving…"
                    : "No address to resolve to."}
              </p>
            )}
            {expiry ? (
              <p
                className={
                  flagged
                    ? "inline-flex items-center gap-1.5 text-xs font-semibold text-warning"
                    : "inline-flex items-center gap-1.5 text-xs text-fg-muted"
                }
              >
                <Clock3 size={13} aria-hidden="true" />
                {expiry.expired ? `Expired ${expiry.text}` : `Expires ${expiry.text}`}
              </p>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
