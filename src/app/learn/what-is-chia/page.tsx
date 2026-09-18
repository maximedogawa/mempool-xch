import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "@/widgets/learn/LearnArticle";

export const metadata: Metadata = { title: "What is Chia?" };

export default function Page() {
  return (
    <LearnArticle slug="what-is-chia">
      <p>
        Chia is a public blockchain that launched in 2021. Its native coin is XCH. Like Bitcoin it has no company deciding who may transact, and every
        full node keeps a copy of the whole history. Unlike Bitcoin it is not secured by burning electricity: the network is secured by <strong>disk space</strong>{" "}
        (see <Link href={routes.learnArticle("proof-of-space-and-time")}>proof of space and time</Link>). Anyone with spare storage can take part in
        producing blocks, which Chia calls <em>farming</em>.
      </p>
      <h2>Coins, not accounts</h2>
      <p>
        Chia does not keep balances in accounts. Value lives in <strong>coins</strong>, each with an amount in mojos (one XCH is a trillion mojos) and a{" "}
        <strong>puzzle hash</strong>, the hash of the small program that decides how the coin may be spent. Spending a coin destroys it and creates new
        coins; an address is simply a puzzle hash written in a friendlier form. When this site shows an &ldquo;address balance&rdquo; it is adding up the
        unspent coins that share one puzzle hash.
      </p>
      <h2>Coins are programs</h2>
      <p>
        The program behind a coin is written in <strong>Chialisp</strong> and runs on the CLVM, a tiny virtual machine every node executes. That is what makes
        tokens (<Link href={routes.tokens()}>CATs</Link>), NFTs, decentralised identities and <Link href={routes.learnArticle("offers-and-trading")}>offers</Link>{" "}
        possible without special-casing them in the protocol: they are just coins with particular puzzles. It also explains the word <em>cost</em> you will see
        everywhere here: every spend has a CLVM cost, and a block can carry at most 11 billion of it.
      </p>
      <h2>Blocks every nine seconds, transactions in a third of them</h2>
      <p>
        A new block arrives on average every 18.75 seconds, but only about one in three is a <strong>transaction block</strong> that actually includes spends;
        the others only carry the proofs that keep the chain moving. The <Link href={routes.home()}>dashboard</Link> shows both kinds and counts down to the
        next transaction block.
      </p>
      <h2>Where the coins came from</h2>
      <p>
        Every block pays 0.5 XCH to the farmer and 1.5 XCH to the pool of the winning plot (halving over time), so new coins enter circulation at a known
        rate. Before the first block, Chia Network created a 21 million XCH <Link href={routes.prefarm()}>prefarm</Link> held in publicly auditable custody
        wallets.
      </p>
    </LearnArticle>
  );
}
