import type { Metadata } from "next";
import { NftCollectionsPage } from "@/widgets/nft/NftCollectionsPage";

export const metadata: Metadata = { title: "NFT collections" };

export default function Page() {
  return <NftCollectionsPage />;
}
