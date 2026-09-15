import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { NftPage } from "@/widgets/assets/NftPage";

export const metadata: Metadata = { title: "NFT" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <NftPage />
    </Suspense>
  );
}
