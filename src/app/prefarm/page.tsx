import type { Metadata } from "next";
import { VaultsPage } from "@/widgets/vaults/VaultsPage";

export const metadata: Metadata = { title: "Prefarm tracker" };

export default function Page() {
  // Kept as an alias of /vaults so older links (Learn articles, footer) keep working in the static export too.
  return <VaultsPage />;
}
