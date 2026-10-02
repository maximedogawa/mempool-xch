/** src/widgets/learn: the Learn index, the article frame and every Learn article. */
import { defineNamespace } from "../../translate";

const messages = {
  index: {
    title: "Learn",
    intro:
      "Short explanations of the things this explorer shows, written for people who use Chia rather than build it. Each article links to the page where you can watch the concept live.",
    alsoWorth:
      "Also worth a look: the <prefarm>prefarm tracker</prefarm>, the <docs>help page</docs> about this site, and the <status>status page</status> for the services it depends on.",
  },
  article: {
    breadcrumb: "Breadcrumb",
    learn: "Learn",
    minRead: "{minutes} min read",
    moreArticles: "More articles",
    allArticles: "All articles →",
  },
  whatIsChia: {
    title: "What is Chia?",
    summary:
      "A blockchain secured by disk space instead of electricity or stake, with coins that are tiny programs.",
    intro:
      "Chia is a public blockchain that launched in 2021. Its native coin is XCH. Like Bitcoin it has no company deciding who may transact, and every full node keeps a copy of the whole history. Unlike Bitcoin it is not secured by burning electricity: the network is secured by <strong>disk space</strong> (see <pos>proof of space and time</pos>). Anyone with spare storage can take part in producing blocks, which Chia calls <em>farming</em>.",
    coinsTitle: "Coins, not accounts",
    coins:
      "Chia does not keep balances in accounts. Value lives in <strong>coins</strong>, each with an amount in mojos (one XCH is a trillion mojos) and a <strong>puzzle hash</strong>, the hash of the small program that decides how the coin may be spent. Spending a coin destroys it and creates new coins; an address is simply a puzzle hash written in a friendlier form. When this site shows an “address balance” it is adding up the unspent coins that share one puzzle hash.",
    programsTitle: "Coins are programs",
    programs:
      "The program behind a coin is written in <strong>Chialisp</strong> and runs on the CLVM, a tiny virtual machine every node executes. That is what makes tokens (<tokens>CATs</tokens>), NFTs, decentralised identities and <offers>offers</offers> possible without special-casing them in the protocol: they are just coins with particular puzzles. It also explains the word <em>cost</em> you will see everywhere here: every spend has a CLVM cost, and a block can carry at most 11 billion of it.",
    blocksTitle: "A block every 18.75 seconds, transactions in a third of them",
    blocks:
      "A new block arrives on average every 18.75 seconds, but only about one in three is a <strong>transaction block</strong> that actually includes spends; the others only carry the proofs that keep the chain moving. The <dashboard>dashboard</dashboard> shows both kinds and counts down to the next transaction block.",
    originTitle: "Where the coins came from",
    origin:
      "Every block pays a reward of 1 XCH, 1/8 to the farmer and 7/8 to the pool of the winning plot. It halves every three years (it was 2 XCH at launch) until it stays at 0.125 XCH from 2033, so new coins enter circulation at a known rate. Before the first block, Chia Network created a 21 million XCH <prefarm>prefarm</prefarm> held in publicly auditable custody wallets.",
  },
  proofOfSpaceAndTime: {
    title: "Proof of space and time",
    summary:
      "How plots, challenges and verifiable delay functions decide who farms the next block.",
    intro:
      "Chia's consensus answers the same question as Bitcoin's mining, <em>who gets to add the next block?</em>, but with a lottery you enter by storing data rather than by computing hashes as fast as possible.",
    spaceTitle: "Proof of space",
    space:
      "A farmer fills disks with <strong>plots</strong>: large files of precomputed hash tables. Every few seconds the network publishes a random <strong>challenge</strong>. Each plot is checked against it; a plot “wins” when it contains a proof whose quality beats a threshold set by the current <strong>difficulty</strong>. The more space you have, the more lottery tickets you hold: your chance of winning is your share of the total space, the <em>netspace</em> shown on the <dashboard>dashboard</dashboard>. Checking a plot is cheap, so farming uses roughly the power of an idle computer.",
    timeTitle: "Proof of time",
    time: "Space alone is not enough: a farmer with a fast machine could try to rewrite history by grinding through alternatives. Chia therefore interleaves every block with a <strong>verifiable delay function</strong> (VDF) computed by <em>timelords</em>. A VDF takes a fixed amount of sequential time to compute, no matter how many processors you have, yet is quick to verify. The chain advances only as fast as real time passes, and that is what makes a block's position in time trustworthy.",
    signageTitle: "Signage points and infusion",
    signage:
      "Time is divided into <strong>sub-slots</strong> of 64 signage points, about 10 minutes each. Challenges are issued at signage points; a winning proof must be <em>infused</em> into the chain a few signage points later, once the timelord has produced the corresponding VDF. That is why a block's page shows a signage point index and why several farmers can win nearly the same slot: the protocol allows it, and the chain picks the heavier branch. When two branches compete for a moment you see a <strong>reorg</strong> on the <blocks>blocks page</blocks>; in Chia these are usually one block deep.",
    youTitle: "Why it matters for you",
    you: "Nothing about your transaction changes how blocks are found. What you control is the <strong>fee</strong>, which decides how quickly a farmer includes your spend once it is in the <mempool>mempool</mempool>.",
  },
  farmingAndPlotting: {
    title: "Farming and plotting",
    summary:
      "What a plot is, what a farmer does at every signage point (about every nine seconds), and where pools fit in.",
    plottingTitle: "Plotting",
    plotting:
      "A plot is a file, typically around 100 GB, produced once by a plotter and then farmed for years. Creating it means building seven hash tables and sorting them, which takes a while and a lot of temporary space; that work is the “proof of work” Chia moves out of the way so that the ongoing cost of farming is close to zero. Plots are tied to a <strong>plot NFT</strong> or to your own keys, which is what decides who gets paid when the plot wins.",
    farmingTitle: "Farming",
    farming:
      "A farmer runs a full node plus a <em>harvester</em> for each machine with plots. Every signage point the harvester looks up the challenge in each plot and, if a proof of good enough quality exists, the farmer builds a block and broadcasts it. The full node validates blocks from everyone else and keeps the copy of the chain that this explorer reads through <settings>a node or Coinset</settings>.",
    rewardsTitle: "Rewards",
    rewards:
      "Each block creates two reward coins: a farmer reward of 1/8 and a pool reward of 7/8 (currently 0.125 and 0.875 XCH, after the 2024 halving; the total halves again in 2027 and 2030 and stays at 0.125 XCH from 2033). The <blocks>block page</blocks> lists the reward claims a transaction block incorporates, and the <pools>pools page</pools> attributes the pool reward to the pool it was paid to.",
    poolsTitle: "Pools",
    pools:
      "With a small farm you may go months without winning. A <strong>pool</strong> smooths that out: your plot NFT points at the pool, the pool receives the 0.875 XCH pool reward whenever any member wins, and pays members by their share of partial proofs submitted. Because pooling is part of the protocol you keep your keys and switch pools by spending your plot NFT, which is a normal transaction you can find in the mempool like any other.",
    hereTitle: "What you can see here",
    hereNetspace:
      "<dashboard>Netspace</dashboard>: the total plotted space the network estimates from recent difficulty.",
    herePools: "<pools>Pool share</pools>: who farmed the last day of blocks.",
    hereMap: "<map>Node map</map>: where full nodes handed out by the introducers are located.",
  },
  whatIsTheMempool: {
    title: "What is the mempool?",
    summary:
      "Where spend bundles wait, how the node picks them for a block, and what this site shows you about it.",
    intro:
      "When a wallet sends a transaction it does not go into a block straight away. It is broadcast to full nodes, each of which validates it and puts it in its <strong>mempool</strong>: the waiting room of spends that are valid but not yet confirmed. The next farmer to win a transaction block fills it from that room. This site is a window onto the mempool of the node it reads from.",
    bundlesTitle: "Spend bundles, not transactions",
    bundles:
      "What waits in the mempool is a <strong>spend bundle</strong>: a set of coin spends plus one aggregated signature. A simple payment spends one or two coins and creates two (the payment and the change); an offer being taken or a token swap can spend dozens. Its id is the hash of the bundle, and that is what you paste into search to follow it.",
    fillTitle: "How a block gets filled",
    fill: "A block has room for 11 billion units of <strong>cost</strong>, and each bundle uses some of it. The node sorts waiting bundles by <strong>fee per cost</strong> (mojos per unit of cost), takes the best-paying ones first, and stops when the block is full. The dashboard's <dashboard>next block</dashboard> view runs the same packing on the live mempool so you can see roughly which block your spend will land in and watch the block fill up as bundles arrive.",
    feesTitle: "Fees",
    fees: "Most of the time the mempool is not full, and zero-fee spends confirm within a few blocks. Fees start to matter in two situations: when the mempool holds more than the node's limit (ten blocks worth of cost) so that only paying spends are accepted, and when more bundles wait than the next block can carry. The <fees>fees page</fees> shows the node's own estimate for reaching a block within one, five or ten minutes and what a typical transfer costs at that rate.",
    leavingTitle: "Leaving the mempool",
    leaving:
      "A bundle leaves the mempool when a block includes it (<em>confirmed</em>), when one of its coins gets spent by another bundle first, or when the node drops it after a reorg or because it is no longer valid (<em>removed</em>). A transaction page keeps showing a removed bundle's coins when Coinset recorded it; nodes themselves forget dropped bundles.",
    graphsTitle: "Reading the graphs",
    graphsCost:
      "<strong>Cost used</strong> is how much of the mempool's capacity is taken, split by fee band.",
    graphsIncoming: "<strong>Incoming</strong> is bundles per minute as seen by this browser.",
    graphsProjected:
      "<strong>Projected blocks</strong> group the queue into blocks in the order the node would pick them.",
  },
  offersAndTrading: {
    title: "Offers and trading",
    summary:
      "Peer-to-peer swaps of XCH, CATs and NFTs without an exchange, and how they look on chain.",
    intro:
      "An <strong>offer</strong> is a half-finished transaction: the maker signs coin spends that give away something (say 10 XCH) on the condition that something else (say 1,000 of a token) is paid to them in the same bundle. The offer is a file, usually shared through a marketplace such as Dexie. It does nothing on chain until a <em>taker</em> completes the other half and pushes the whole bundle; then both sides settle atomically or not at all.",
    noExchangeTitle: "Why it needs no exchange",
    noExchange:
      "Because the maker's coins are only spendable together with the taker's payment, nobody has to trust a middleman. The maker keeps custody until the moment of the swap, can cancel by spending the offered coins themselves, and can set an expiry. This works for XCH, CATs and NFTs alike, which is how Chia has NFT sales, token markets and even multi-asset bundles without a custodial exchange.",
    onChainTitle: "What an offer looks like on chain",
    onChain:
      "Once taken, an offer is an ordinary spend bundle: on its <mempool>mempool</mempool> and transaction pages you will see it tagged as an offer or swap, with each participant's sent and received assets. Before that, only the marketplace knows it exists; Coinset indexes the offers it sees and this site shows their state on the <tokens>token</tokens>, NFT and address pages, and on an offer's own page once you know its id.",
    lifecycleTitle: "Offer lifecycle",
    lifecycleOpen: "<strong>Open</strong>: published, coins still unspent.",
    lifecycleTaking: "<strong>Taking</strong>: a taker's bundle is in the mempool.",
    lifecycleTaken: "<strong>Taken</strong>: confirmed in a block.",
    lifecycleCancelled:
      "<strong>Cancelled</strong> or <strong>expired</strong>: the maker spent the coins otherwise, or the expiry passed.",
    clawbackTitle: "Clawbacks",
    clawback:
      "A related idea is the <strong>clawback</strong>: a payment the sender can pull back for a set time before the receiver may claim it, a safety net against sending to the wrong address. Coins like that show up on an <address>address page</address> with their timelock until they are claimed or revoked.",
  },
  questions: {
    title: "Common questions",
    summary:
      "Short answers to the things people ask most: fees, confirmations, coins, addresses and reorgs.",
    pending: {
      q: "My transaction is pending. How long will it take?",
      a: "Look it up: the transaction page shows the projected block and its ETA, based on where the bundle sits when the mempool is sorted by fee per cost. With an empty mempool a zero-fee spend lands in the next transaction block, usually within a minute.",
    },
    fee: {
      q: "How much fee should I pay?",
      a: "Usually none. When the mempool is busy, the <fees>fees page</fees> shows the node's estimate per target time; 5 mojos per cost is the rate at which a spend replaces a cheaper one, and a typical transfer costs a few million cost units, so even a “high” fee is a fraction of a cent.",
    },
    confirmations: {
      q: "How many confirmations do I need?",
      a: "Chia reorgs are almost always one block deep, so most wallets treat a spend as final after a handful of blocks; exchanges wait longer. The block page shows how many blocks sit on top of a given one.",
    },
    ids: {
      q: "What is the difference between a coin id, a transaction id and a puzzle hash?",
      a: "A <strong>coin id</strong> names one coin (hash of parent, puzzle hash and amount). A <strong>transaction id</strong> names a spend bundle. A <strong>puzzle hash</strong> is what an address encodes: the spending rule coins are locked to. Search accepts all three and works out which is which.",
    },
    coins: {
      q: "Why does my address show more coins than transactions?",
      a: "Wallets split change into several coins and CATs, NFTs and DIDs are wrapped coins that only <em>hint</em> at your address. The address page counts both the plain XCH coins and the hinted ones.",
    },
    reorg: {
      q: "What is a reorg and did I lose my transaction?",
      a: "A reorg replaces the newest block(s) with a competing branch. Your spend goes back into the mempool and is normally included again a block later; the <blocks>blocks page</blocks> lists recent reorgs and their depth.",
    },
    data: {
      q: "Where does this site get its data?",
      a: "From Coinset's public full-node and indexed API, Dexie for token names and icons, and MintGarden for NFTs, all read directly by your browser; you can point it at your own node in <settings>settings</settings>. The <status>status page</status> shows whether each of them is reachable right now.",
    },
    prefarm: {
      q: "What is the prefarm?",
      a: "The 21 million XCH Chia Network created before the first block, held in four custody wallets with public audit rules. The <prefarm>prefarm tracker</prefarm> reads their on-chain balances.",
    },
  },
};

export default defineNamespace("learn", messages);
