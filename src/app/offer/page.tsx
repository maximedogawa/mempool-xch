import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { OfferPage } from "@/widgets/offers/OfferPage";

export const metadata: Metadata = { title: "Offer" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <OfferPage />
    </Suspense>
  );
}
