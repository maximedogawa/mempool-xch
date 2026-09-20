"use client";

import { AtSign, ExternalLink, RefreshCw, Wallet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useDetailId } from "@/shared/hooks/useDetailId";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { describeExpiry } from "@/shared/lib/handles/expiry";
import { parseHandle, xchandlesUrl, type HandleStatus } from "@/shared/lib/handles/xchandles";
import { formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  EmptyState,
  Hash,
  Skeleton,
} from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { WatchButton } from "@/widgets/watchlist/WatchButton";
import { useHandle } from "./useHandle";

const STATUS: Record<HandleStatus, { label: string; tone: "primary" | "warning" | "neutral" }> = {
  active: { label: "Registered", tone: "primary" },
  expired: { label: "Expired", tone: "warning" },
  unknown: { label: "Not registered", tone: "neutral" },
  syncing: { label: "Registry syncing", tone: "warning" },
  unavailable: { label: "Registry unreachable", tone: "warning" },
};

/**
 * One XCHandles name: what it resolves to, who holds it and how long it has left. The registry
 * at api.xchandles.com is the authority for all of that; MintGarden only supplies the name NFT's
 * artwork, so a miss there leaves the page intact.
 */
export function HandlePage() {
  const raw = useDetailId("handle") ?? "";
  const { networkConfig } = useSettings();
  const handle = useMemo(() => parseHandle(raw), [raw]);
  const { record, art, registration, isLoading, available, refetch } = useHandle(handle);

  if (!handle)
    return (
      <EmptyState
        tone="danger"
        title="Not a valid handle"
        description={`An XCHandles handle is 3 to 63 lowercase letters and digits, with no dots or dashes. Got: ${raw || "(empty)"}`}
      />
    );
  if (!available)
    return (
      <EmptyState
        title="Handles are a mainnet registry"
        description="XCHandles runs on mainnet only. Switch the network back to mainnet to resolve a handle."
      />
    );

  const status = record?.status ?? "unavailable";
  const address = record?.p2PuzzleHash
    ? puzzleHashToAddress(record.p2PuzzleHash, networkConfig.addressPrefix)
    : (art?.address ?? null);
  const expiration = record?.expiration ?? null;
  const expiry = expiration !== null ? describeExpiry(expiration) : null;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title="Handle"
          action={
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
              <a
                href={xchandlesUrl(handle)}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                XCHandles
                <ExternalLink size={12} aria-hidden="true" />
              </a>
              <WatchButton kind="handle" id={handle} label={handle} />
            </span>
          }
        />
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {art?.thumbnailUrl ? (
            <AssetImage
              urls={[art.thumbnailUrl]}
              alt={`Name NFT of ${handle}`}
              className="h-28 w-28 shrink-0 self-center sm:self-start"
            />
          ) : (
            <span className="flex h-28 w-28 shrink-0 items-center justify-center self-center rounded-card border border-border bg-surface-2 text-fg-faint sm:self-start">
              <AtSign size={32} aria-hidden="true" />
            </span>
          )}
          <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-3 text-sm">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                Handle
              </dt>
              <dd className="mono flex min-w-0 items-center gap-1 break-all text-base">
                {handle}
                <CopyButton value={handle} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                Resolves to
              </dt>
              <dd className="min-w-0 text-sm">
                {isLoading ? (
                  <Skeleton className="h-5 w-72" />
                ) : address ? (
                  <span className="mono flex min-w-0 items-center gap-1 break-all">
                    <Link href={routes.address(address)} className="text-accent hover:underline">
                      {address}
                    </Link>
                    <CopyButton value={address} />
                  </span>
                ) : (
                  <span className="text-fg-faint">
                    {status === "unknown"
                      ? "Nobody has registered this handle."
                      : "No address to resolve to."}
                  </span>
                )}
              </dd>
            </div>
            {expiry && expiration !== null ? (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  {expiry.expired ? "Expired" : "Expires"}
                </dt>
                <dd
                  className={
                    expiry.soon || expiry.expired ? "text-sm font-semibold text-warning" : "text-sm"
                  }
                >
                  {expiry.text}
                  <span className="ml-2 text-xs font-normal text-fg-faint">
                    {formatDateTime(expiration * 1000)}
                  </span>
                </dd>
              </div>
            ) : null}
            {art?.nftId ? (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Name NFT
                </dt>
                <dd className="min-w-0">
                  <Hash value={art.nftId} href={routes.nft(art.nftId)} head={14} tail={8} copy />
                </dd>
              </div>
            ) : null}
            {record?.ownerLauncherId ? (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Owner launcher id
                </dt>
                <dd className="mono min-w-0 break-all text-xs text-fg-muted">
                  0x{record.ownerLauncherId}
                  <CopyButton value={`0x${record.ownerLauncherId}`} />
                </dd>
              </div>
            ) : null}
          </dl>
        </CardBody>
      </Card>

      {status === "syncing" || status === "unavailable" ? (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-fg-muted">
              {status === "syncing"
                ? "The registry index is behind the chain and would rather say so than answer from stale state. Try again in a moment."
                : "The XCHandles registry could not be reached."}
            </p>
            <Button size="sm" onClick={refetch}>
              <RefreshCw size={14} aria-hidden="true" />
              Retry
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {registration ? (
        <Card>
          <CardHeader title="Registry" />
          <CardBody>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Last action
                </dt>
                <dd className="capitalize">{registration.actionKind}</dd>
              </div>
              {registration.confirmationHeight !== null ? (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                    Confirmed in
                  </dt>
                  <dd>
                    <Link
                      href={routes.block(registration.confirmationHeight)}
                      className="tabular text-accent hover:underline"
                    >
                      Block {formatNumber(registration.confirmationHeight)}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {registration.protocolFee !== null ? (
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                    Protocol fee
                  </dt>
                  <dd className="tabular">
                    {formatNumber(registration.protocolFee)}{" "}
                    <span className="text-fg-faint">mojos of the payment CAT</span>
                  </dd>
                </div>
              ) : null}
            </dl>
          </CardBody>
        </Card>
      ) : null}

      {status === "unknown" ? (
        <EmptyState
          title={`${handle} is not registered`}
          description="No live slot in the registry resolves this handle. It can be registered on xchandles.com."
          action={
            <a
              href={xchandlesUrl(handle)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              <Wallet size={14} aria-hidden="true" />
              Open it on XCHandles
            </a>
          }
        />
      ) : null}
    </div>
  );
}
