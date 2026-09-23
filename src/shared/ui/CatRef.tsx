"use client";

import Link from "next/link";
import { useAsset } from "@/shared/api/useTokenList";
import { shortId } from "@/shared/lib/chia/hex";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { routes } from "@/shared/lib/routes";
import { AssetIcon } from "./AssetBadge";

/**
 * One CAT, resolved through the shared token registry: icon + ticker (name and full
 * asset id in the tooltip), linked to the CAT page. Falls back to a short asset id
 * when the registry does not know the token, so an id never shows up bare.
 */
export function CatRef({
  assetId,
  amountText,
  iconUrl,
  size = 16,
  showId = false,
  className,
}: {
  assetId: string;
  /** Icon the caller already knows (e.g. from the Sage wallet); registry/Dexie otherwise. */
  iconUrl?: string | null;
  /** Already formatted amount (with sign if wanted) shown before the ticker. */
  amountText?: string;
  size?: number;
  /** Also print the short asset id after the ticker. */
  showId?: boolean;
  className?: string;
}) {
  const t = useT("ui");
  const id = assetId.toLowerCase().replace(/^0x/, "");
  const token = useAsset(id);
  const label = token?.symbol ?? `CAT ${shortId(id, 4, 4)}`;
  const title = token ? `${token.name} (${token.symbol}) · 0x${id}` : t("cat.unknown", { id });
  return (
    <Link
      href={routes.cat(id)}
      title={title}
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap hover:underline",
        className
      )}
    >
      <AssetIcon kind="cat" assetId={id} iconUrl={iconUrl} size={size} />
      <span className="tabular">
        {amountText ? `${amountText} ` : ""}
        <span className="font-medium">{label}</span>
      </span>
      {showId && token ? (
        <span className="mono text-xs text-fg-faint">{shortId(id, 6, 4)}</span>
      ) : null}
    </Link>
  );
}

/** Ticker or short id for a CAT, for plain-text contexts (titles, tooltips). */
export function useCatLabel(assetId: string | null | undefined): string | undefined {
  const token = useAsset(assetId ?? undefined);
  if (!assetId) return undefined;
  return token?.symbol ?? `CAT ${shortId(assetId.replace(/^0x/, ""), 4, 4)}`;
}
