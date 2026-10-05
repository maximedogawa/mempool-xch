import type { Metadata } from "next";
import { FarmingAndPlotting } from "@/widgets/learn/articles/FarmingAndPlotting";

export const metadata: Metadata = { title: "Farming and plotting" };

export default function Page() {
  return <FarmingAndPlotting />;
}
