import type { Metadata } from "next";
import { ReorgHistory } from "@/widgets/blocks/ReorgHistory";
import { BlocksList } from "@/widgets/blocksList/BlocksList";

export const metadata: Metadata = { title: "Blocks" };

export default function BlocksPage() {
  return (
    <div className="flex flex-col gap-5">
      <BlocksList />
      <ReorgHistory />
    </div>
  );
}
