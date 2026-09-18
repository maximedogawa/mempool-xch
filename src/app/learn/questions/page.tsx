import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "@/widgets/learn/LearnArticle";

const QA: { q: string; a: React.ReactNode }[] = [
  {
    q: "My transaction is pending. How long will it take?",
    a: (
      <>
        Look it up: the transaction page shows the projected block and its ETA, based on where the bundle sits when the mempool is sorted by fee per cost.
        With an empty mempool a zero-fee spend lands in the next transaction block, usually within a minute.
      </>
    ),
  },
  {
    q: "How much fee should I pay?",
    a: (
      <>
        Usually none. When the mempool is busy, the <Link href={routes.fees()}>fees page</Link> shows the node&apos;s estimate per target time; 5 mojos per
        cost is the rate at which a spend replaces a cheaper one, and a typical transfer costs a few million cost units, so even a &ldquo;high&rdquo; fee is
        a fraction of a cent.
      </>
    ),
  },
  {
    q: "How many confirmations do I need?",
    a: (
      <>
        Chia reorgs are almost always one block deep, so most wallets treat a spend as final after a handful of blocks; exchanges wait longer. The block page
        shows how many blocks sit on top of a given one.
      </>
    ),
  },
  {
    q: "What is the difference between a coin id, a transaction id and a puzzle hash?",
    a: (
      <>
        A <strong>coin id</strong> names one coin (hash of parent, puzzle hash and amount). A <strong>transaction id</strong> names a spend bundle. A{" "}
        <strong>puzzle hash</strong> is what an address encodes: the spending rule coins are locked to. Search accepts all three and works out which is which.
      </>
    ),
  },
  {
    q: "Why does my address show more coins than transactions?",
    a: (
      <>
        Wallets split change into several coins and CATs, NFTs and DIDs are wrapped coins that only <em>hint</em> at your address. The address page counts
        both the plain XCH coins and the hinted ones.
      </>
    ),
  },
  {
    q: "What is a reorg and did I lose my transaction?",
    a: (
      <>
        A reorg replaces the newest block(s) with a competing branch. Your spend goes back into the mempool and is normally included again a block later;
        the <Link href={routes.blocks()}>blocks page</Link> lists recent reorgs and their depth.
      </>
    ),
  },
  {
    q: "Where does this site get its data?",
    a: (
      <>
        From Coinset&apos;s public full-node and indexed API, Dexie for token names and icons, and MintGarden for NFTs, all read directly by your browser;
        you can point it at your own node in <Link href={routes.settings()}>settings</Link>. The <Link href={routes.status()}>status page</Link> shows whether
        each of them is reachable right now.
      </>
    ),
  },
  {
    q: "What is the prefarm?",
    a: (
      <>
        The 21 million XCH Chia Network created before the first block, held in four custody wallets with public audit rules. The{" "}
        <Link href={routes.prefarm()}>prefarm tracker</Link> reads their on-chain balances.
      </>
    ),
  },
];

export const metadata: Metadata = { title: "Common questions" };

export default function Page() {
  return (
    <LearnArticle slug="questions">
      {QA.map(({ q, a }) => (
        <section key={q} className="flex flex-col gap-1">
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
    </LearnArticle>
  );
}
