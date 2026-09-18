import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "@/widgets/learn/LearnArticle";

export const metadata: Metadata = { title: "What is the mempool?" };

export default function Page() {
  return (
    <LearnArticle slug="what-is-the-mempool">
      <p>
        When a wallet sends a transaction it does not go into a block straight away. It is broadcast
        to full nodes, each of which validates it and puts it in its <strong>mempool</strong>: the
        waiting room of spends that are valid but not yet confirmed. The next farmer to win a
        transaction block fills it from that room. This site is a window onto the mempool of the
        node it reads from.
      </p>
      <h2>Spend bundles, not transactions</h2>
      <p>
        What waits in the mempool is a <strong>spend bundle</strong>: a set of coin spends plus one
        aggregated signature. A simple payment spends one or two coins and creates two (the payment
        and the change); an offer being taken or a token swap can spend dozens. Its id is the hash
        of the bundle, and that is what you paste into search to follow it.
      </p>
      <h2>How a block gets filled</h2>
      <p>
        A block has room for 11 billion units of <strong>cost</strong>, and each bundle uses some of
        it. The node sorts waiting bundles by <strong>fee per cost</strong> (mojos per unit of
        cost), takes the best-paying ones first, and stops when the block is full. The
        dashboard&apos;s
        <Link href={routes.home()}> next block</Link> view runs the same packing on the live mempool
        so you can see roughly which block your spend will land in and watch the block fill up as
        bundles arrive.
      </p>
      <h2>Fees</h2>
      <p>
        Most of the time the mempool is not full, and zero-fee spends confirm within a few blocks.
        Fees start to matter in two situations: when the mempool holds more than the node&apos;s
        limit (ten blocks worth of cost) so that only paying spends are accepted, and when more
        bundles wait than the next block can carry. The <Link href={routes.fees()}>fees page</Link>{" "}
        shows the node&apos;s own estimate for reaching a block within one, five or ten minutes and
        what a typical transfer costs at that rate.
      </p>
      <h2>Leaving the mempool</h2>
      <p>
        A bundle leaves the mempool when a block includes it (<em>confirmed</em>), when one of its
        coins gets spent by another bundle first, or when the node drops it after a reorg or because
        it is no longer valid (<em>removed</em>). A transaction page keeps showing a removed
        bundle&apos;s coins when Coinset recorded it; nodes themselves forget dropped bundles.
      </p>
      <h2>Reading the graphs</h2>
      <ul>
        <li>
          <strong>Cost used</strong> is how much of the mempool&apos;s capacity is taken, split by
          fee band.
        </li>
        <li>
          <strong>Incoming</strong> is bundles per minute as seen by this browser.
        </li>
        <li>
          <strong>Projected blocks</strong> group the queue into blocks in the order the node would
          pick them.
        </li>
      </ul>
    </LearnArticle>
  );
}
