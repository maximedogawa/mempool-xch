import type { Metadata } from "next";
import { BlocksRow } from "@/widgets/blocks/BlocksRow";
import { LatestBlocks, LiveTransactions } from "@/widgets/feed/LiveFeed";
import { FeeCards } from "@/widgets/fees/FeeCards";
import { MempoolStats } from "@/widgets/mempool/MempoolStats";

export const metadata: Metadata = { title: "Mempool.xch · Chia mempool explorer" };

export default function HomePage() {
  return (
    <div className="flex flex-col gap-5">
      <BlocksRow />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <FeeCards />
        <MempoolStats />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LiveTransactions />
        <LatestBlocks />
      </div>
    </div>
  );
}
