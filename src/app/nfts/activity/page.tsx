import type { Metadata } from "next";
import { NftActivityPage } from "@/widgets/nft/NftActivityPage";

export const metadata: Metadata = { title: "NFT activity" };

export default function Page() {
  return <NftActivityPage />;
}
