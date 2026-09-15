import type { Metadata } from "next";
import { BlocksList } from "@/widgets/blocksList/BlocksList";

export const metadata: Metadata = { title: "Blocks" };

export default function BlocksPage() {
  return <BlocksList />;
}
