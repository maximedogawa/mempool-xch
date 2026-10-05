import type { Metadata } from "next";
import { ChartsPage } from "@/widgets/charts/ChartsPage";

export const metadata: Metadata = { title: "Charts" };

export default function Page() {
  return <ChartsPage />;
}
