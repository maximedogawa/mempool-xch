import type { Metadata } from "next";
import { Card, CardBody, CardHeader } from "@/shared/ui";

export const metadata: Metadata = { title: "Docs" };

const WIKI = "https://github.com/maximedogawa/mempool-xch-wiki/blob/main";

function Code({ children }: { children: string }) {
  return <pre tabIndex={0} className="mono overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted">{children}</pre>;
}

export default function DocsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Docs</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Short version of the guides. The full documentation lives in the{" "}
          <a href={WIKI} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            mempool-xch-wiki
          </a>
          .
        </p>
      </div>

      <Card id="about">
        <CardHeader title="What you are looking at" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            Mempool.xch shows the Chia network the way mempool.space shows Bitcoin. <strong className="text-fg">Projected blocks</strong> (left of the dotted line) are computed in your browser by packing every pending spend bundle by fee per CLVM cost into blocks of at most 11 billion cost, the same greedy order a Chia node uses. <strong className="text-fg">Confirmed blocks</strong> (right) are the latest transaction blocks; the small +N markers are the non-transaction blocks in between, which carry no spends.
          </p>
          <p>
            Chia fees are paid per cost, not per byte, and the mempool accepts 0-fee spends while it has capacity, so a 0 estimate is normal. A spend bundle is Chia&apos;s transaction: it destroys coins (removals) and creates coins (additions).
          </p>
        </CardBody>
      </Card>

      <Card id="data">
        <CardHeader title="Data sources" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            Everything comes from <a href="https://coinset.org" target="_blank" rel="noreferrer" className="text-accent hover:underline">Coinset</a>: the public full-node RPC (<span className="mono">api.coinset.org</span>, <span className="mono">testnet11.api.coinset.org</span>), its indexed API for semantic transaction summaries and address history, and its WebSocket for live peak and transaction events. The raw mempool is heavy (puzzle reveals), so the hosted server keeps a compact, incrementally synced summary at <span className="mono">/api/&lt;network&gt;/mempool</span> that the dashboard reads every few seconds.
          </p>
          <p>
            Mempool history has no server-side archive: the graph is sampled in your browser while the app is open and kept for two hours in local storage.
          </p>
        </CardBody>
      </Card>

      <Card id="custom-node">
        <CardHeader title="Using your own node" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            Settings → Full-node RPC endpoints accepts any Chia full-node RPC over HTTPS. A stock node (<span className="mono">https://localhost:8555</span>) needs mutual TLS with the node&apos;s client certificate and sends no CORS headers, neither of which a browser can do. Run a small reverse proxy that presents the certificate and adds CORS, for example with Caddy:
          </p>
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
          <p>
            Then enter <span className="mono">http://localhost:8556</span> (or your HTTPS hostname) as the endpoint and press <em>Test connection</em>. With a custom node the app polls instead of streaming, fetches the raw mempool in the browser, and hides Coinset-only features (semantic summaries, address history, CAT and NFT pages).
          </p>
        </CardBody>
      </Card>

      <Card id="sage">
        <CardHeader title="Install in the Sage wallet" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            Mempool.xch ships as a Sage in-app app. In Sage 0.13 or newer open <em>Apps → Install from URL</em> and paste the hosted origin, for example <span className="mono">{process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL : "https://<your host>"}</span> (the same URL serves the site and the Sage snapshot). Inside Sage the app follows the wallet&apos;s network and theme.
          </p>
        </CardBody>
      </Card>

      <Card id="more">
        <CardHeader title="More" />
        <CardBody className="text-sm text-fg-muted">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a href={`${WIKI}/architecture/overview.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Architecture overview</a>
            </li>
            <li>
              <a href={`${WIKI}/architecture/data-sources.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Data sources and fallbacks</a>
            </li>
            <li>
              <a href={`${WIKI}/deployment/docker-once.md`} target="_blank" rel="noreferrer" className="text-accent hover:underline">Deployment with Docker and ONCE</a>
            </li>
            <li>
              <a href="https://github.com/maximedogawa/mempool-xch" target="_blank" rel="noreferrer" className="text-accent hover:underline">Source on GitHub</a>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
