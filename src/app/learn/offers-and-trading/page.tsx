import type { Metadata } from "next";
import { OffersAndTrading } from "@/widgets/learn/articles/OffersAndTrading";

export const metadata: Metadata = { title: "Offers and trading" };

export default function Page() {
  return <OffersAndTrading />;
}
