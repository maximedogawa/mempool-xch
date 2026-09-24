/** Pools page: farming pool share of recent blocks (src/widgets/pools). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Pools",
  group: {
    selfPooled: "Self-pooling farmer",
    unnamed: "Unnamed pool",
    unknown: "Unknown",
    everyoneElse: "everyone else",
  },
  bar: {
    label: "Share of the last {count} blocks: {summary}",
  },
  stats: {
    blocks: "Blocks",
    heights: "heights {start} – {end}",
    largest: "Largest",
    largestHint: "The biggest single group in the window.",
    named: "Named pools",
    namedSub: "{blocks} blocks · {pools} pools",
    namedHint:
      "Share won by pools in the registry, each confirmed from the pool's own pool_info endpoint or another recorded source.",
    payouts: "Payout addresses",
    payoutsSub: "in {count} groups",
    payoutsHint:
      "Distinct pool payout addresses that won a block in the window. Every PlotNFT farmer has their own, so a pool owns many.",
  },
  share: {
    title: "Share by pool",
    search: "Search pool or address",
    loadError: "Could not load pool share",
    noClaims:
      "Reward claims come from Coinset's indexed API, which a custom node does not offer: PlotNFT farmers are listed one by one here instead of under their pool.",
    resolving: {
      one: "Checking where {count} payout address has its rewards claimed; pools grow as results arrive. Your browser remembers them for the next visit.",
      other:
        "Checking where {count} payout addresses have their rewards claimed; pools grow as results arrive. Your browser remembers them for the next visit.",
    },
    noMatch: 'No pool or address matches "{search}".',
    colPool: "Pool",
    colPayouts: "Payout addresses",
    colBlocks: "Blocks",
    colShare: "Share",
    showTop: "Show the top {count}",
    showAll: "Show all {count} rows",
  },
  row: {
    bothShares: "both shares",
    bothSharesHint:
      "The pool reward (7/8) and the farmer reward (1/8) go to the same address on every block, so this is not a PlotNFT of the official pool protocol: a solo farmer, or an operator with its own protocol.",
    claimsTo: "claims to <hash></hash>",
    showFewer: "Show fewer",
    more: "+{count} more",
  },
  footnote:
    "A block's payout address and the claim that empties it are both on chain, so the grouping is exact; only the names come from a registry, matched against the target address a pool publishes at its <code>pool_info</code> endpoint. An address whose rewards were never claimed (a fresh PlotNFT, or a pool that has not collected yet) stays \"Unknown\" until it is. Know a pool that is missing? Add a sourced entry to <code>src/shared/lib/pools/registry.json</code> (see the wiki's contribution note).",
};

export default defineNamespace("pools", messages);
