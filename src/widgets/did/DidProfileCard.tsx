"use client";

import { BadgeCheck, ExternalLink, Globe, Image as ImageIcon, UserRound } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { mintGardenCollectionUrl, mintGardenProfileUrl } from "@/shared/lib/nft/mintgarden";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { useT } from "@/shared/i18n/useT";
import { useDidHoldings } from "./useDidProfile";
import didNs from "@/shared/i18n/messages/en/did";

/**
 * The public face of a DID: the MintGarden profile and the collections its NFTs come from.
 * A DID with no MintGarden presence answers with empty fields, so the card only claims what it
 * actually got back.
 */
export function DidProfileCard({ launcherId, didId }: { launcherId: string; didId: string }) {
  const t = useT(didNs);
  const { profile, collections, isLoading, available } = useDidHoldings(launcherId);
  if (!available)
    return (
      <Card>
        <CardHeader title={t("title")} />
        <CardBody>
          <p className="text-sm text-fg-muted">{t("mainnetOnly")}</p>
        </CardBody>
      </Card>
    );
  const known = profile?.name || profile?.bio || profile?.avatarUrl || !!profile?.ownedNfts;
  return (
    <Card>
      <CardHeader
        title={t("title")}
        action={
          <a
            href={mintGardenProfileUrl(didId)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            MintGarden
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        }
      />
      <CardBody className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-start gap-3">
            {profile?.avatarUrl ? (
              <AssetImage
                urls={[profile.avatarUrl]}
                alt={profile.name ?? t("avatarAlt")}
                className="h-14 w-14 shrink-0"
                rounded="rounded-full"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-fg-faint">
                <UserRound size={22} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-base font-semibold">
                {profile?.name ?? t("unnamed")}
                {profile?.verified ? (
                  <BadgeCheck size={15} className="text-primary" aria-label={t("verified")} />
                ) : null}
              </p>
              {profile?.bio ? (
                <p className="mt-1 whitespace-pre-line text-sm text-fg-muted">{profile.bio}</p>
              ) : !known ? (
                <p className="mt-1 text-sm text-fg-faint">{t("noProfile")}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {profile?.ownedNfts !== null && profile?.ownedNfts !== undefined ? (
                  <Link
                    href={routes.ownedNfts(didId)}
                    className="inline-flex items-center gap-1.5 text-accent hover:underline"
                  >
                    <ImageIcon size={13} aria-hidden="true" />
                    {t("nftsHeld", { count: profile.ownedNfts })}
                  </Link>
                ) : null}
                {profile?.website ? (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer noopener nofollow"
                    className="inline-flex items-center gap-1 text-fg-muted hover:text-accent"
                  >
                    <Globe size={12} aria-hidden="true" />
                    {t("website")}
                  </a>
                ) : null}
                {profile?.twitterHandle ? (
                  <a
                    href={`https://x.com/${encodeURIComponent(profile.twitterHandle)}`}
                    target="_blank"
                    rel="noreferrer noopener nofollow"
                    className="text-fg-muted hover:text-accent"
                  >
                    @{profile.twitterHandle}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        )}
        {collections?.length ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {t("collectionsHeld")}
            </p>
            <ul className="flex flex-wrap gap-2">
              {collections.slice(0, 12).map((c) => (
                <li key={c.id}>
                  <a
                    href={mintGardenCollectionUrl(c.id)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-bg/50 py-1 pl-1 pr-3 text-xs hover:border-primary/40"
                  >
                    <AssetImage
                      urls={c.thumbnailUrl ? [c.thumbnailUrl] : []}
                      alt=""
                      className="h-6 w-6 shrink-0"
                      rounded="rounded-full"
                    />
                    <span className="max-w-40 truncate">{c.name ?? c.id}</span>
                    <span className="tabular text-fg-faint">{formatNumber(c.nftsOwned)}</span>
                  </a>
                </li>
              ))}
              {collections.length > 12 ? (
                <li className="self-center text-xs text-fg-faint">
                  {t("more", { count: collections.length - 12 })}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
