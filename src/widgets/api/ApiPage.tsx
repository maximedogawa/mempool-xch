"use client";

import { useState } from "react";
import { API_GROUPS, RPC_BASE, RPC_BASE_TESTNET, WS_URL, type ApiEndpoint } from "@/shared/config/apiReference";
import { Badge, Card, CardBody, CardHeader, CopyButton } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { routes } from "@/shared/lib/routes";

function curl(endpoint: ApiEndpoint): string {
  return `curl -s -X POST ${RPC_BASE}/${endpoint.method} \\\n  -H "content-type: application/json" \\\n  -d '${endpoint.body}'`;
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-b border-border/60 py-2.5 last:border-b-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full flex-wrap items-start justify-between gap-2 text-left">
        <span className="flex flex-wrap items-center gap-2">
          <span className="mono text-sm font-semibold text-fg">{endpoint.method}</span>
          <Badge tone={endpoint.api === "indexed" ? "info" : "neutral"}>{endpoint.api === "indexed" ? "Coinset only" : "any full node"}</Badge>
        </span>
        <span className="text-xs text-fg-faint">{open ? "Hide example" : "Show example"}</span>
      </button>
      <p className="mt-1 text-sm text-fg-muted">{endpoint.summary}</p>
      {open ? (
        <div className="mt-2 flex items-start gap-2">
          <pre tabIndex={0} className="mono w-full overflow-x-auto rounded-sm border border-border bg-bg p-3 text-xs leading-relaxed text-fg-muted">
            {curl(endpoint)}
          </pre>
          <CopyButton value={curl(endpoint)} />
        </div>
      ) : null}
    </li>
  );
}

export function ApiPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">API reference</h1>
          <Tooltip
            text="mempoolxch.space has no server API of its own: every page you see reads a chain endpoint directly from your browser, the same way this app does (decision-012). This page documents the calls the app itself makes, so you can make them too, against Coinset's public endpoint or your own node."
            placement="bottom"
          />
        </div>
      </header>

      <Card>
        <CardHeader title="Base URLs" />
        <CardBody className="flex flex-col gap-2 text-sm">
          <p>
            Every method below is a <span className="mono">POST</span> to <span className="mono">{"{base}"}/{"{method}"}</span> with a JSON body, no
            authentication, CORS open. The full-node RPC and Coinset&apos;s indexed API share the same host.
          </p>
          <ul className="flex flex-col gap-1">
            <li>
              <span className="text-fg-muted">Mainnet:</span> <span className="mono">{RPC_BASE}</span>
            </li>
            <li>
              <span className="text-fg-muted">Testnet11:</span> <span className="mono">{RPC_BASE_TESTNET}</span>
            </li>
            <li>
              <span className="text-fg-muted">WebSocket (peak and transaction events):</span> <span className="mono">{WS_URL}</span>
            </li>
          </ul>
          <p className="text-xs text-fg-faint">
            Full OpenAPI specs: <span className="mono">coinset.org/openapi/full_node_bundled.json</span> and{" "}
            <span className="mono">coinset.org/openapi/coinset_bundled.json</span>. Endpoints marked &quot;any full node&quot; work against your own node
            too — see <a href={`${routes.docs()}#custom-node`} className="text-accent hover:underline">Settings → custom node</a>.
          </p>
        </CardBody>
      </Card>

      {API_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader title={group.title} />
          <CardBody>
            <ul>
              {group.endpoints.map((endpoint) => (
                <EndpointRow key={endpoint.method} endpoint={endpoint} />
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader title="Other data" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            CAT names, tickers and icons come from Dexie&apos;s public registry: <span className="mono">GET https://api.dexie.space/v1/assets?type=cat</span>{" "}
            (paginated, 100 per page), icons at <span className="mono">https://icons.dexie.space/{"{asset_id}"}.webp</span>.
          </p>
          <p>
            NFT metadata and images come from MintGarden: <span className="mono">GET https://api.mintgarden.io/nfts/{"{nft1_id}"}</span>.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Rate limits and fair use" />
        <CardBody className="flex flex-col gap-2 text-sm text-fg-muted">
          <p>
            These are Coinset&apos;s, Dexie&apos;s and MintGarden&apos;s endpoints, not ours: we cannot set their rate limits, and none are published as of
            this writing. Be considerate — cache what you fetch, batch where an endpoint allows it (for example{" "}
            <span className="mono">get_block_records</span>&apos; height range, capped at 1,000 per call), and avoid polling faster than roughly once per
            block (~18–20 s on mainnet).
          </p>
          <p>
            mempoolxch.space&apos;s own{" "}
            <a href={routes.legalTerms()} className="text-accent hover:underline">
              Terms of use
            </a>{" "}
            still govern this site itself (uptime, acceptable use of the pages you load here); using Coinset, Dexie or MintGarden directly is between you
            and them.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
