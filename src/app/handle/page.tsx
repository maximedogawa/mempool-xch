import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { HandlePage } from "@/widgets/handle/HandlePage";

export const metadata: Metadata = { title: "Handle" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <HandlePage />
    </Suspense>
  );
}
