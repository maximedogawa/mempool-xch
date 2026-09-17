import type { Metadata } from "next";
import { NftHomePage } from "@/widgets/nft/NftHomePage";

export const metadata: Metadata = { title: "NFTs" };

export default function Page() {
  return <NftHomePage />;
}
