import type { Metadata } from "next";
import { FeesPage } from "@/widgets/fees/FeesPage";

export const metadata: Metadata = { title: "Fees" };

export default function Page() {
  return <FeesPage />;
}
