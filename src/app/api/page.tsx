import type { Metadata } from "next";
import { ApiPage } from "@/widgets/api/ApiPage";

export const metadata: Metadata = { title: "API reference" };

export default function Page() {
  return <ApiPage />;
}
