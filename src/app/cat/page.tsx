import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { CatPage } from "@/widgets/assets/CatPage";

export const metadata: Metadata = { title: "CAT token" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <CatPage />
    </Suspense>
  );
}
