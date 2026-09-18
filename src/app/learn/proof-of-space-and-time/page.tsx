import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "@/widgets/learn/LearnArticle";

export const metadata: Metadata = { title: "Proof of space and time" };

export default function Page() {
  return (
    <LearnArticle slug="proof-of-space-and-time">
      <p>
        Chia&apos;s consensus answers the same question as Bitcoin&apos;s mining, <em>who gets to add the next block?</em>, but with a lottery you enter by
        storing data rather than by computing hashes as fast as possible.
      </p>
      <h2>Proof of space</h2>
      <p>
        A farmer fills disks with <strong>plots</strong>: large files of precomputed hash tables. Every few seconds the network publishes a random{" "}
        <strong>challenge</strong>. Each plot is checked against it; a plot &ldquo;wins&rdquo; when it contains a proof whose quality beats a threshold set
        by the current <strong>difficulty</strong>. The more space you have, the more lottery tickets you hold: your chance of winning is your share of the
        total space, the <em>netspace</em> shown on the <Link href={routes.home()}>dashboard</Link>. Checking a plot is cheap, so farming uses roughly the power
        of an idle computer.
      </p>
      <h2>Proof of time</h2>
      <p>
        Space alone is not enough: a farmer with a fast machine could try to rewrite history by grinding through alternatives. Chia therefore interleaves
        every block with a <strong>verifiable delay function</strong> (VDF) computed by <em>timelords</em>. A VDF takes a fixed amount of sequential time
        to compute, no matter how many processors you have, yet is quick to verify. The chain advances only as fast as real time passes, and that is what
        makes a block&apos;s position in time trustworthy.
      </p>
      <h2>Signage points and infusion</h2>
      <p>
        Time is divided into <strong>sub-slots</strong> of 64 signage points, about 10 minutes each. Challenges are issued at signage points; a winning proof
        must be <em>infused</em> into the chain a few signage points later, once the timelord has produced the corresponding VDF. That is why a block&apos;s
        page shows a signage point index and why several farmers can win nearly the same slot: the protocol allows it, and the chain picks the heavier
        branch. When two branches compete for a moment you see a <strong>reorg</strong> on the <Link href={routes.blocks()}>blocks page</Link>; in Chia
        these are usually one block deep.
      </p>
      <h2>Why it matters for you</h2>
      <p>
        Nothing about your transaction changes how blocks are found. What you control is the <strong>fee</strong>, which decides how quickly a farmer
        includes your spend once it is in the <Link href={routes.learnArticle("what-is-the-mempool")}>mempool</Link>.
      </p>
    </LearnArticle>
  );
}
