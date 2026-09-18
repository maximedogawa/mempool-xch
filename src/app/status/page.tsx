import type { Metadata } from "next";
import { StatusPage } from "@/widgets/status/StatusPage";

export const metadata: Metadata = { title: "Status" };

export default function Page() {
  return <StatusPage />;
}
