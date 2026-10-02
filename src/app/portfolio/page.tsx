import type { Metadata } from "next";
import { PortfolioPage } from "@/widgets/portfolio/PortfolioPage";

export const metadata: Metadata = { title: "Portfolio" };

export default function Page() {
  return <PortfolioPage />;
}
