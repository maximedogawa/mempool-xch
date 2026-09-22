/** src/widgets/docs: the Help page. */
const messages = {
  title: "Help",
  why: {
    title: "Why mempoolxch.space",
    intro:
      "A handful of things this build does that other Chia explorers we compared against do not, as of the last check:",
    sage: "A Sage in-app wallet page: your pending transactions on the dashboard with queue position and a confirmation chime.",
    projected:
      "Projected next blocks packed the way the node actually fills them (cost-ordered), not just a queue length.",
    cats: "Every CAT gets a name and icon from the Dexie registry, on every page that shows one, not just a lookup page.",
    a11y: "Accessibility checked on every route: automated axe AA passes and a full keyboard walk, in the test suite, not just claimed.",
    openSource:
      "Open source under MIT, one Docker image, deployed the same way documented in the repo.",
    comparison:
      "The full feature-by-feature comparison, including what still favours the competition, is kept up to date in the <link>competitor matrix</link> (wiki).",
  },
  reading: {
    title: "Reading the dashboard",
    projected: {
      q: "What are the blocks left of the dotted line?",
      a: "They do not exist yet. They are the next transaction blocks the way the network is likely to fill them: every pending spend bundle, sorted by the fee it pays per unit of cost, packed into blocks of 11 billion cost. The block right next to the line is the next one; the ones further left come after. Each shows the typical fee rate inside, the fee range, the total fees, how many spend bundles it holds and roughly when it will be farmed. Click one to see what is in it.",
    },
    confirmed: {
      q: "And the blocks on the right?",
      a: "The transaction blocks that were just confirmed, newest first, with their fees, reward claims, age and the farmer who won them. Chia farms a block about every 19 seconds but only every third one carries transactions; the small +N markers count the empty ones in between.",
    },
    zeroFee: {
      q: "Why is the fee estimate usually 0?",
      a: "Chia is not Bitcoin. Fees are paid per unit of CLVM cost, and the mempool accepts spends with no fee at all as long as it has room. The capacity bar shows how full it is (ten blocks worth of cost). When it fills up, paying a fee moves you ahead of the 0-fee backlog, and the cards show the rate that gets you into the next block, in five minutes or in ten.",
    },
    nextBlock: {
      q: 'What does "Next block" show?',
      a: "The composition of the block about to be farmed: one cell per spend bundle, sized by its cost, coloured by its fee band, outlined by asset kind. Use the chips to spotlight XCH, CAT, NFT, offer or DID spends. Hover a cell for details, click to open the transaction.",
    },
    graph: {
      q: "What is the mempool graph?",
      a: "How much cost is waiting, split by fee band, over the last two hours. It is sampled by your browser while the page is open, so it starts when you first opened the app.",
    },
  },
  search: {
    title: "Finding your transaction",
    paste: {
      q: "What can I paste into the search box?",
      a: "A transaction (spend bundle) id, a block height or header hash, an xch or txch address, a coin id, a CAT asset id, an nft1 id or a did:chia: id. A plain word is looked up as an XCHandles handle and searched as an NFT or collection name at the same time. Press <kbd>/</kbd> anywhere to jump to the box. If a 64-character hex id could be several things, the app checks the mempool, transactions, coins and blocks and shows you the candidates.",
    },
    handle: {
      q: "What is a handle?",
      a: "XCHandles (xchandles.com) is a name registry on Chia: a handle such as <mono>@maximedogawa</mono> is a registry slot that resolves to a name NFT, and that NFT's address is where a payment to the name goes. Its page shows what it resolves to today, who holds it and when the registration runs out, and it can be watched like an address. Handle data comes from the registry's own read-only API, mainnet only.",
    },
    sent: {
      q: "I sent a transaction. Where is it?",
      a: "Paste its id or your address. A pending transaction shows which projected block it sits in and an estimated time; once confirmed it shows the block, confirmations and what moved between which addresses. The address page lists your pending transactions at the top and refreshes on its own.",
    },
    notClassified: {
      q: 'Why does a coin page say "not classified"?',
      a: "The classification comes from Coinset's coin details, which are not always available. Plain XCH coins rarely need one; CAT and NFT coins still link to their asset pages from the transaction view.",
    },
  },
  sage: {
    title: "Using it inside the Sage wallet",
    install: {
      q: "How do I install it?",
      a: "In Sage 0.13 or newer open <em>Apps → Install from URL</em> and paste <mono>{site}</mono>. Sage downloads and verifies the app; from then on it follows your wallet's network and theme, and a <em>My wallet</em> entry opens your own address page once you allow it to read your receive address.",
    },
    network: {
      q: "Why does the network switch look disabled?",
      a: "Inside Sage the app always shows the network your wallet is on.",
    },
    data: {
      q: "Where does the data come from inside Sage?",
      a: "Everything that is yours comes from the wallet itself: balance, sync state, pending and past transactions, your coins, whether an address is yours, and the XCH price. Sage is a light wallet, and its app bridge offers no node queries (no peak, mempool or block lookups), so the mempool, blocks and other people's addresses still come from the chain endpoint in Settings, Coinset by default or a node you whitelist.",
    },
  },
  customNode: {
    title: "Using your own node",
    need: {
      q: "Do I need a node?",
      a: "No. By default everything comes from Coinset's public Chia full node and its index, which also powers the live updates, address history and CAT/NFT pages.",
    },
    mine: {
      q: "I want to use mine anyway.",
      a: "Settings → Full-node RPC endpoints accepts any Chia full-node RPC over HTTPS. A stock node listens on <mono>https://localhost:8555</mono> with client-certificate TLS and no CORS headers, which a browser cannot talk to directly, so put a small proxy in front of it:",
    },
    changes: {
      q: "What changes with my own node?",
      a: "The app polls instead of streaming and fetches the raw mempool itself. Coinset-only features (semantic transaction summaries, address history, CAT and NFT history) are hidden with a note. Everything block, coin and mempool related keeps working.",
    },
    channels: {
      q: "Where do live updates come from?",
      a: "The connection pill (hover it), the footer and Settings name the channel your tab is on. There is no server in between: this site only hosts the app itself, and every tab talks to the chain endpoint directly.",
      socket:
        "<strong>Coinset socket</strong>: your tab streams peak height and transaction events from Coinset's WebSocket directly. The normal mode on mempoolxch.space and inside the Sage in-app snapshot.",
      polling:
        "<strong>Polling</strong>: no stream is available, so the tab asks the endpoint every few seconds. Always the case with a custom node, and the fallback if the socket cannot connect.",
    },
  },
  more: {
    title: "More",
    api: "API reference: every Coinset call this app makes, with examples",
    install: "Install and use",
    customNode: "Custom or local node, with nginx too",
    overview: "How it works under the hood",
    load: "Data source load and long-term options",
    source: "Source on GitHub (MIT)",
  },
};

export default messages;
