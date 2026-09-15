import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { AddressPage } from "@/widgets/address/AddressPage";

export const metadata: Metadata = { title: "Address" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <AddressPage />
    </Suspense>
  );
}
