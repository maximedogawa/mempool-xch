import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui";
import { OwnedNftsPage } from "@/widgets/nft/OwnedNftsPage";

export const metadata: Metadata = { title: "Owned NFTs" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <OwnedNftsPage />
    </Suspense>
  );
}
