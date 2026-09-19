import type { Metadata } from "next";
import { MarketPage } from "@/widgets/market/MarketPage";

export const metadata: Metadata = { title: "Market" };

export default function Page() {
  return <MarketPage />;
}
