import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "@/widgets/learn/LearnArticle";

export const metadata: Metadata = { title: "Farming and plotting" };

export default function Page() {
  return (
    <LearnArticle slug="farming-and-plotting">
      <h2>Plotting</h2>
      <p>
        A plot is a file, typically around 100 GB, produced once by a plotter and then farmed for
        years. Creating it means building seven hash tables and sorting them, which takes a while
        and a lot of temporary space; that work is the &ldquo;proof of work&rdquo; Chia moves out of
        the way so that the ongoing cost of farming is close to zero. Plots are tied to a{" "}
        <strong>plot NFT</strong> or to your own keys, which is what decides who gets paid when the
        plot wins.
      </p>
      <h2>Farming</h2>
      <p>
        A farmer runs a full node plus a <em>harvester</em> for each machine with plots. Every
        signage point the harvester looks up the challenge in each plot and, if a proof of good
        enough quality exists, the farmer builds a block and broadcasts it. The full node validates
        blocks from everyone else and keeps the copy of the chain that this explorer reads through{" "}
        <Link href={routes.settings()}>a node or Coinset</Link>.
      </p>
      <h2>Rewards</h2>
      <p>
        Each block creates two reward coins: a farmer reward and a pool reward (0.25 and 0.75 XCH
        after the third halving in 2033, currently 0.5 and 1.5). The{" "}
        <Link href={routes.blocks()}>block page</Link> lists the reward claims a transaction block
        incorporates, and the <Link href={routes.pools()}>pools page</Link> attributes the pool
        reward to the pool it was paid to.
      </p>
      <h2>Pools</h2>
      <p>
        With a small farm you may go months without winning. A <strong>pool</strong> smooths that
        out: your plot NFT points at the pool, the pool receives the 1.5 XCH reward whenever any
        member wins, and pays members by their share of partial proofs submitted. Because pooling is
        part of the protocol you keep your keys and switch pools by spending your plot NFT, which is
        a normal transaction you can find in the mempool like any other.
      </p>
      <h2>What you can see here</h2>
      <ul>
        <li>
          <Link href={routes.home()}>Netspace</Link>: the total plotted space the network estimates
          from recent difficulty.
        </li>
        <li>
          <Link href={routes.pools()}>Pool share</Link>: who farmed the last day of blocks.
        </li>
        <li>
          <Link href={routes.map()}>Node map</Link>: where full nodes handed out by the introducers
          are located.
        </li>
      </ul>
    </LearnArticle>
  );
}
