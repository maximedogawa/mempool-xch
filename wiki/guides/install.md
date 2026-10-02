# Install and use

## In the browser

Open **[mempoolxch.space](https://mempoolxch.space)**. Nothing to install, nothing to sync.

**The front page in ten seconds**

- Left of the dotted line: the blocks about to be farmed and what will be in them. The one next
  to the line is next. Click a block to list its spend bundles.
- Right of the line: the transaction blocks just confirmed, with fees, reward claims, age and
  farmer. +N markers are the empty blocks in between (Chia farms one every ~19 s, only every
  third carries transactions).
- Transaction fees: what gets you in the next block, in five minutes, in ten. 0 is normal on
  Chia while the capacity bar has room.
- Block time: how long since the last transaction block and how long the gap usually is.
- Mempool: how much is waiting, by fee band, over the last two hours (sampled while the page
  is open).
- Next block: the composition of the coming block, one cell per spend bundle, sized by cost,
  coloured by fee. Chips spotlight XCH, CAT, NFT, offers or DIDs.
- Latest transactions and latest blocks: live feeds; hover a feed to pause it.

**Finding things**: press `/` and paste a transaction id, block height or hash, xch/txch address,
coin id, CAT id, `nft1…` or `did:chia:…` id. Ambiguous 64-character ids show the candidates.

**Networks and settings**: the header switch toggles mainnet and testnet11. Settings lets you
use your own node ([custom-node.md](custom-node.md)), pick light or dark, and set how many
recent blocks the strip shows. Settings stay in your browser.

## Inside the Sage wallet

Sage 0.13 or newer → Apps → Install from URL → paste `https://mempoolxch.space`. Sage downloads
and verifies the app. Inside Sage it follows your wallet's network and theme, external links
open through Sage, and a **My wallet** entry shows your balance, sync state, pending transactions, every asset you
hold with its balance, and your full transaction and coin history (recent first, the rest
loads as you scroll) straight from the wallet once you allow it. Sage is a light wallet, not a
full node, so the mempool, blocks and other addresses still come from the configured node
(Coinset by default).

## Self-hosting

`docker compose up --build` in the repository serves the same image that runs
mempoolxch.space on http://localhost:8080; production runs it under ONCE
([docker-once.md](../deployment/docker-once.md)).
