import type { Metadata } from "next";
import { MempoolList } from "@/widgets/mempoolList/MempoolList";

export const metadata: Metadata = { title: "Mempool" };

export default function MempoolPage() {
  return <MempoolList />;
}
