import type { Metadata } from "next";
import { Suspense } from "react";
import { BlockPageClient } from "./BlockPageClient";

export const metadata: Metadata = { title: "Block" };

export default function BlockPage() {
  return (
    <Suspense fallback={null}>
      <BlockPageClient />
    </Suspense>
  );
}
