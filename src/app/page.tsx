import type { Metadata } from "next";
import { BlocksRow } from "@/widgets/blocks/BlocksRow";
import { BlockTime } from "@/widgets/blocktime/BlockTime";
import { LatestBlocks, LiveTransactions } from "@/widgets/feed/LiveFeed";
import { FeeCards } from "@/widgets/fees/FeeCards";
import { NextBlockGoggles } from "@/widgets/goggles/NextBlockGoggles";
import { MempoolStats } from "@/widgets/mempool/MempoolStats";
import { WalletPending } from "@/widgets/wallet/WalletPending";
import { WatchlistPanel } from "@/widgets/watchlist/WatchlistPanel";

export const metadata: Metadata = {
  title: { absolute: "mempoolxch.space · Chia mempool explorer" },
};

export default function HomePage() {
  return (
    <div className="flex flex-col gap-5">
      <BlocksRow />
      <WalletPending />
      <WatchlistPanel />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-5">
          <FeeCards />
          <BlockTime />
        </div>
        <MempoolStats />
      </div>
      <NextBlockGoggles />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <LiveTransactions />
        <LatestBlocks />
      </div>
    </div>
  );
}
