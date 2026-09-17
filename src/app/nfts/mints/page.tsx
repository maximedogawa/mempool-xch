import type { Metadata } from "next";
import { NftMintsPage } from "@/widgets/nft/NftMintsPage";

export const metadata: Metadata = { title: "NFT mints" };

export default function Page() {
  return <NftMintsPage />;
}
