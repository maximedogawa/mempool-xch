/** Coin detail page (src/widgets/coin). */
import { defineNamespace } from "../../translate";

const messages = {
  heading: "Coin",
  spent: "Spent",
  unspent: "Unspent",
  retry: "Retry",
  noId: {
    title: "No coin id",
    description: "Open a coin from a transaction or paste a coin id into the search box.",
  },
  notFound: {
    title: "Coin not found",
    description:
      "No coin with this id exists on this network. Coins created by a pending spend bundle only appear once the bundle is confirmed.",
  },
  loadError: "Could not load the coin",
  stats: {
    amount: "Amount",
    created: "Created",
    spent: "Spent",
    blockHeight: "block height",
    spendPending: "spend pending in mempool",
    noPendingSpend: "no pending spend",
    origin: "Origin",
    reward: "Reward",
    spend: "Spend",
    rewardSub: "coinbase (farmer or pool reward)",
    spendSub: "created by a spend bundle",
  },
  record: {
    title: "Coin record",
    coinId: "Coin id",
    parentCoin: "Parent coin",
    noParent: "(reward: no parent coin)",
    puzzleHash: "Puzzle hash",
    address: "Address",
    owner: "Owner (inner puzzle): <address></address>",
    creatingTx: "Creating transaction",
    spendingTx: "Spending transaction",
    rewardCoin: "none (reward coin)",
    notAvailable: "not available from Coinset right now",
    needsCoinset: "needs Coinset",
    block: "block {height}",
    unspent: "unspent",
  },
  type: {
    title: "Type and asset",
    needsCoinset:
      "Coin classification (XCH, CAT, NFT, DID) needs a Coinset endpoint; the current custom node only provides the raw record.",
    kind: "Kind",
    custodyPuzzle: "Custody puzzle",
    catAssetId: "CAT asset id",
    nft: "NFT",
    launcherId: "Launcher id",
    notClassified:
      "Coinset has not classified this coin (its coin-details endpoint is unavailable or the coin is not indexed yet). Plain XCH coins usually need no classification.",
  },
  pending: {
    title: "Pending spends in the mempool",
    none: "No spend bundle in the mempool spends this coin.",
    spendBundle: "Spend bundle",
    fee: "Fee",
    cost: "Cost",
    feePerCost: "Fee / cost",
  },
  children: {
    title: "Children",
    titleCount: "Children ({count})",
    noneSpent: "No child coins were found for this coin.",
    noneUnspent: "Unspent coins have no children yet.",
    coinId: "Coin id",
    address: "Address",
    amount: "Amount",
    status: "Status",
    spentAt: "spent at {height}",
    unspent: "unspent",
  },
};

export default defineNamespace("coin", messages);
