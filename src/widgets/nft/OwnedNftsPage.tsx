"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useDetailId } from "@/shared/hooks/useDetailId";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { EmptyState, Hash } from "@/shared/ui";
import { AddressNfts } from "@/widgets/address/AddressNfts";
import { resolveAddressId } from "@/widgets/address/resolveAddressId";
import { useT } from "@/shared/i18n/useT";
import nftNs from "@/shared/i18n/messages/en/nft";

/** The NFT gallery of an address or of a DID; both are owners MintGarden indexes. */
export function OwnedNftsPage() {
  const t = useT(nftNs);
  const raw = useDetailId("nfts/owned") ?? "";
  const { networkConfig } = useSettings();
  const resolved = resolveAddressId(raw, networkConfig.addressPrefix);
  if (!resolved)
    return (
      <EmptyState title={t("owned.invalidTitle")} description={t("owned.invalidDescription")} />
    );
  const isDid = resolved.kind === "did";
  const owner = resolved.didId ?? resolved.address ?? resolved.puzzleHash;
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <Link
          href={routes.address(owner)}
          className="inline-flex items-center gap-1.5 self-start text-sm text-accent hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {isDid ? t("owned.backToDid") : t("owned.backToAddress")}
        </Link>
        <h1 className="text-xl font-semibold">{t("owned.title")}</h1>
        <div className="text-sm text-fg-muted">
          {t.rich("owned.heldBy", {
            owner: () => (
              <Hash value={owner} href={routes.address(owner)} head={14} tail={8} copy />
            ),
          })}
        </div>
      </header>
      {networkConfig.id === "mainnet" ? (
        <AddressNfts
          key={resolved.puzzleHash}
          owner={{ kind: resolved.kind, id: resolved.puzzleHash }}
        />
      ) : (
        <EmptyState title={t("owned.mainnetTitle")} description={t("owned.mainnetDescription")} />
      )}
    </div>
  );
}
