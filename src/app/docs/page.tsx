import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "Help" };

const WIKI = "https://github.com/maximedogawa/mempool-xch-wiki/blob/main";
const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://mempoolxch.space";

function Code({ children }: { children: string }) {
  return <pre tabIndex={0} className="mono overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted">{children}</pre>;
}

function Q({ q, children, id }: { q: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-fg">{q}</h3>
      <div className="text-sm text-fg-muted">{children}</div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Help</h1>
        <p className="mt-1 text-sm text-fg-muted">What the screens mean and how to get the most out of them. Deeper technical notes are in the{" "}
          <a href={WIKI} target="_blank" rel="noreferrer" className="text-accent hover:underline">wiki</a>.
        </p>
      </div>

      <Card id="why">
        <CardHeader title="Why mempoolxch.space" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            A handful of things this build does that other Chia explorers we compared against do not, as of the last check:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>A Sage in-app wallet page: your pending transactions on the dashboard with queue position and a confirmation chime.</li>
            <li>Projected next blocks packed the way the node actually fills them (cost-ordered), not just a queue length.</li>
            <li>Every CAT gets a name and icon from the Dexie registry, on every page that shows one, not just a lookup page.</li>
            <li>Accessibility checked on every route: automated axe AA passes and a full keyboard walk, in the test suite, not just claimed.</li>
            <li>Open source under MIT, one Docker image, deployed the same way documented in the repo.</li>
          </ul>
          <p>
            The full feature-by-feature comparison, including what still favours the competition, is kept up to date in the{" "}
            <a href={`${WIKI}/architecture/competitors.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              competitor matrix
            </a>{" "}
            (wiki).
          </p>
        </CardBody>
      </Card>

      <Card id="reading">
        <CardHeader title="Reading the dashboard" />
        <CardBody className="flex flex-col gap-4">
          <Q q="What are the blocks left of the dotted line?">
            They do not exist yet. They are the next transaction blocks the way the network is likely to fill them: every pending spend bundle,
            sorted by the fee it pays per unit of cost, packed into blocks of 11 billion cost. The block right next to the line is the next one;
            the ones further left come after. Each shows the typical fee rate inside, the fee range, the total fees, how many spend bundles it
            holds and roughly when it will be farmed. Click one to see what is in it.
          </Q>
          <Q q="And the blocks on the right?">
            The transaction blocks that were just confirmed, newest first, with their fees, reward claims, age and the farmer who won them. Chia farms a
            block about every 19 seconds but only every third one carries transactions; the small +N markers count the empty ones in between.
          </Q>
          <Q q="Why is the fee estimate usually 0?">
            Chia is not Bitcoin. Fees are paid per unit of CLVM cost, and the mempool accepts spends with no fee at all as long as it has room.
            The capacity bar shows how full it is (ten blocks worth of cost). When it fills up, paying a fee moves you ahead of the 0-fee backlog,
            and the cards show the rate that gets you into the next block, in five minutes or in ten.
          </Q>
          <Q q="What does &quot;Next block&quot; show?">
            The composition of the block about to be farmed: one cell per spend bundle, sized by its cost, coloured by its fee band, outlined by asset
            kind. Use the chips to spotlight XCH, CAT, NFT, offer or DID spends. Hover a cell for details, click to open the transaction.
          </Q>
          <Q q="What is the mempool graph?">
            How much cost is waiting, split by fee band, over the last two hours. It is sampled by your browser while the page is open, so it starts
            when you first opened the app.
          </Q>
        </CardBody>
      </Card>

      <Card id="search">
        <CardHeader title="Finding your transaction" />
        <CardBody className="flex flex-col gap-4">
          <Q q="What can I paste into the search box?">
            A transaction (spend bundle) id, a block height or header hash, an xch or txch address, a coin id, a CAT asset id, an nft1 id or a
            did:chia: id. Press <kbd className="rounded-sm border border-border px-1 text-xs">/</kbd> anywhere to jump to the box. If a 64-character hex id could be several things,
            the app checks the mempool, transactions, coins and blocks and shows you the candidates.
          </Q>
          <Q q="I sent a transaction. Where is it?">
            Paste its id or your address. A pending transaction shows which projected block it sits in and an estimated time; once confirmed it
            shows the block, confirmations and what moved between which addresses. The address page lists your pending transactions at the top
            and refreshes on its own.
          </Q>
          <Q q="Why does a coin page say &quot;not classified&quot;?">
            The classification comes from Coinset&apos;s coin details, which are not always available. Plain XCH coins rarely need one; CAT and NFT
            coins still link to their asset pages from the transaction view.
          </Q>
        </CardBody>
      </Card>

      <Card id="sage">
        <CardHeader title="Using it inside the Sage wallet" />
        <CardBody className="flex flex-col gap-4">
          <Q q="How do I install it?">
            In Sage 0.13 or newer open <em>Apps → Install from URL</em> and paste <span className="mono">{SITE}</span>. Sage downloads and verifies the app;
            from then on it follows your wallet&apos;s network and theme, and a <em>My wallet</em> entry opens your own address page once you allow it to
            read your receive address.
          </Q>
          <Q q="Why does the network switch look disabled?">
            Inside Sage the app always shows the network your wallet is on.
          </Q>
          <Q q="Where does the data come from inside Sage?">
            Everything that is yours comes from the wallet itself: balance, sync state, pending and past transactions, your coins, whether an address is
            yours, and the XCH price. Sage is a light wallet, and its app bridge offers no node queries (no peak, mempool or block lookups), so the
            mempool, blocks and other people&apos;s addresses still come from the chain endpoint in Settings, Coinset by default or a node you whitelist.
          </Q>
        </CardBody>
      </Card>

      <Card id="custom-node">
        <CardHeader title="Using your own node" />
        <CardBody className="flex flex-col gap-4">
          <Q q="Do I need a node?">
            No. By default everything comes from Coinset&apos;s public Chia full node and its index, which also powers the live updates, address history
            and CAT/NFT pages.
          </Q>
          <Q q="I want to use mine anyway.">
            Settings → Full-node RPC endpoints accepts any Chia full-node RPC over HTTPS. A stock node listens on <span className="mono">https://localhost:8555</span> with
            client-certificate TLS and no CORS headers, which a browser cannot talk to directly, so put a small proxy in front of it:
          </Q>
          <Code>{`# Caddyfile
:8556 {
  reverse_proxy https://localhost:8555 {
    transport http {
      tls_client_auth ~/.chia/mainnet/config/ssl/full_node/private_full_node.crt ~/.chia/mainnet/config/ssl/full_node/private_full_node.key
      tls_insecure_skip_verify
    }
  }
  header Access-Control-Allow-Origin *
  header Access-Control-Allow-Headers content-type
  @options method OPTIONS
  respond @options 204
}`}</Code>
          <Q q="What changes with my own node?">
            The app polls instead of streaming and fetches the raw mempool itself. Coinset-only features (semantic transaction summaries, address
            history, CAT and NFT history) are hidden with a note. Everything block, coin and mempool related keeps working.
          </Q>
          <Q q="Where do live updates come from?" id="channels">
            The connection pill (hover it), the footer and Settings name the channel your tab is on. There is no server in between: this site only
            hosts the app itself, and every tab talks to the chain endpoint directly (decision-012).
            <ul className="mt-1 list-disc pl-5">
              <li><strong className="text-fg">Coinset socket</strong>: your tab streams peak height and transaction events from Coinset&apos;s WebSocket directly. The normal mode on mempoolxch.space and inside the Sage in-app snapshot.</li>
              <li><strong className="text-fg">Polling</strong>: no stream is available, so the tab asks the endpoint every few seconds. Always the case with a custom node, and the fallback if the socket cannot connect.</li>
            </ul>
          </Q>
        </CardBody>
      </Card>

      <Card id="more">
        <CardHeader title="More" />
        <CardBody className="text-sm text-fg-muted">
          <ul className="list-disc space-y-1 pl-5">
            <li><Link href={routes.api()} className="text-accent hover:underline">API reference: every Coinset call this app makes, with examples</Link></li>
            <li><a href={`${WIKI}/guides/install.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Install and use</a></li>
            <li><a href={`${WIKI}/guides/custom-node.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Custom or local node, with nginx too</a></li>
            <li><a href={`${WIKI}/architecture/overview.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">How it works under the hood</a></li>
            <li><a href={`${WIKI}/architecture/coinset-load.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Data source load and long-term options</a></li>
            <li><a href="https://github.com/maximedogawa/mempool-xch" target="_blank" rel="noreferrer" className="text-accent hover:underline">Source on GitHub (MIT)</a></li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
