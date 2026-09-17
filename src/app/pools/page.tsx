import type { Metadata } from "next";
import { PoolsPage } from "@/widgets/pools/PoolsPage";

export const metadata: Metadata = { title: "Pools" };

export default function Page() {
  return <PoolsPage />;
}
