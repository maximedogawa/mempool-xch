import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "@/widgets/learn/LearnArticle";

export const metadata: Metadata = { title: "Offers and trading" };

export default function Page() {
  return (
    <LearnArticle slug="offers-and-trading">
      <p>
        An <strong>offer</strong> is a half-finished transaction: the maker signs coin spends that
        give away something (say 10 XCH) on the condition that something else (say 1,000 of a token)
        is paid to them in the same bundle. The offer is a file, usually shared through a
        marketplace such as Dexie. It does nothing on chain until a <em>taker</em> completes the
        other half and pushes the whole bundle; then both sides settle atomically or not at all.
      </p>
      <h2>Why it needs no exchange</h2>
      <p>
        Because the maker&apos;s coins are only spendable together with the taker&apos;s payment,
        nobody has to trust a middleman. The maker keeps custody until the moment of the swap, can
        cancel by spending the offered coins themselves, and can set an expiry. This works for XCH,
        CATs and NFTs alike, which is how Chia has NFT sales, token markets and even multi-asset
        bundles without a custodial exchange.
      </p>
      <h2>What an offer looks like on chain</h2>
      <p>
        Once taken, an offer is an ordinary spend bundle: on its{" "}
        <Link href={routes.mempool()}>mempool</Link> and transaction pages you will see it tagged as
        an offer or swap, with each participant&apos;s sent and received assets. Before that, only
        the marketplace knows it exists; Coinset indexes the offers it sees and this site shows
        their state on the <Link href={routes.tokens()}>token</Link>, NFT and address pages, and on
        an offer&apos;s own page once you know its id.
      </p>
      <h2>Offer lifecycle</h2>
      <ul>
        <li>
          <strong>Open</strong>: published, coins still unspent.
        </li>
        <li>
          <strong>Taking</strong>: a taker&apos;s bundle is in the mempool.
        </li>
        <li>
          <strong>Taken</strong>: confirmed in a block.
        </li>
        <li>
          <strong>Cancelled</strong> or <strong>expired</strong>: the maker spent the coins
          otherwise, or the expiry passed.
        </li>
      </ul>
      <h2>Clawbacks</h2>
      <p>
        A related idea is the <strong>clawback</strong>: a payment the sender can pull back for a
        set time before the receiver may claim it, a safety net against sending to the wrong
        address. Coins like that show up on an{" "}
        <Link href={routes.learnArticle("questions")}>address page</Link> with their timelock until
        they are claimed or revoked.
      </p>
    </LearnArticle>
  );
}
