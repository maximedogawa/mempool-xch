"use client";

import { Eye, Image as ImageIcon, UserRound } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { launcherIdToDidId } from "@/shared/lib/chia/address";
import { routes } from "@/shared/lib/routes";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { Hash } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { useDidHoldings } from "@/widgets/did/useDidProfile";
import { useT } from "@/shared/i18n/useT";
import { RemoveWatch, WatchStatus } from "./WatchlistParts";
import watchlistNs from "@/shared/i18n/messages/en/watchlist";

/**
 * A watched DID: who it is and what it holds. Unlike an address there is no mempool angle —
 * NFTs move by the coin that carries them, not by the DID — so the row shows holdings from
 * MintGarden rather than pending transactions.
 */
export function WatchedDidRow({ item, onRemove }: { item: WatchItem; onRemove: () => void }) {
  const t = useT(watchlistNs);
  const didId = item.label.startsWith("did:chia:") ? item.label : launcherIdToDidId(item.id);
  const { profile, collections, isLoading, available } = useDidHoldings(item.id);
  const owned = profile?.ownedNfts ?? null;
  return (
    <li className="min-w-0 rounded-xl border border-border bg-bg/50 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        {profile?.avatarUrl ? (
          <AssetImage
            urls={[profile.avatarUrl]}
            alt={profile.name ?? t("did.avatarAlt")}
            className="h-10 w-10 shrink-0"
            rounded="rounded-xl"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
            <UserRound size={18} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              DID
            </span>
            <WatchStatus>
              <Eye size={11} aria-hidden="true" />
              {!available
                ? t("common.mainnetOnly")
                : isLoading
                  ? t("common.checking")
                  : owned !== null
                    ? t("did.nftCount", { count: owned })
                    : t("common.watching")}
            </WatchStatus>
          </div>
          {profile?.name ? (
            <p className="truncate text-sm font-semibold" title={profile.name}>
              {profile.name}
            </p>
          ) : null}
          <Hash
            value={didId}
            href={routes.address(didId)}
            head={14}
            tail={6}
            copy
            className={profile?.name ? "text-xs text-fg-muted" : "text-sm font-semibold"}
          />
        </div>
        <RemoveWatch label={didId} onRemove={onRemove} />
      </div>
      <div className="mt-3 border-t border-border/60 pt-3">
        {!available ? (
          <p className="text-xs text-fg-muted">{t("did.mainnetNote")}</p>
        ) : collections?.length ? (
          <>
            <ul className="flex flex-wrap gap-1.5">
              {collections.slice(0, 4).map((c) => (
                <li
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 text-[11px]"
                >
                  <AssetImage
                    urls={c.thumbnailUrl ? [c.thumbnailUrl] : []}
                    alt=""
                    className="h-4 w-4 shrink-0"
                    rounded="rounded-full"
                  />
                  <span className="max-w-32 truncate">{c.name ?? c.id}</span>
                  <span className="tabular text-fg-faint">{formatNumber(c.nftsOwned)}</span>
                </li>
              ))}
              {collections.length > 4 ? (
                <li className="self-center text-[11px] text-fg-faint">
                  {t("did.moreCollections", { count: collections.length - 4 })}
                </li>
              ) : null}
            </ul>
            <Link
              href={routes.ownedNfts(didId)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <ImageIcon size={13} aria-hidden="true" />
              {t("did.viewNfts")}
            </Link>
          </>
        ) : isLoading ? (
          <p className="text-xs text-fg-faint">{t("did.loadingHoldings")}</p>
        ) : (
          <p className="text-xs text-fg-faint">
            {owned === null ? t("did.noNftsYet") : t("did.noNfts")}
          </p>
        )}
      </div>
    </li>
  );
}
