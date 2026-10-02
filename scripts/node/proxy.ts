/**
 * Dev proxy for a local Chia full node, so mempoolxch.space in a browser can use it:
 *
 *   bun run node:proxy                 http://127.0.0.1:8556 → https://localhost:8555
 *   bun run node:proxy --port 9000 --node https://localhost:58555
 *
 * A stock node speaks mutual TLS (the browser cannot present the node's client certificate) and
 * sends no CORS headers. This forwards POST /<method> with the node's own client certificate
 * from $CHIA_ROOT/config/ssl/full_node (default ~/.chia/mainnet) and adds CORS. It listens on
 * 127.0.0.1 only, forwards only the methods the app uses (src/shared/lib/node/methods.ts), and
 * only answers pages from localhost or mempoolxch.space, so other sites in the same browser
 * cannot drive the node. It logs method, status and time, never bodies or key material.
 * Then set Settings → Full-node RPC endpoints to http://127.0.0.1:8556.
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { corsHeaders, decide } from "../../src/shared/lib/node/proxyCore";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1]! : fallback;
}

const port = Number(arg("port", "8556"));
const node = arg("node", "https://localhost:8555").replace(/\/+$/, "");
const root = process.env.CHIA_ROOT ?? join(homedir(), ".chia", "mainnet");
const certPath = join(root, "config", "ssl", "full_node", "private_full_node.crt");
const keyPath = join(root, "config", "ssl", "full_node", "private_full_node.key");

const cert = Bun.file(certPath);
const key = Bun.file(keyPath);
if (!(await cert.exists()) || !(await key.exists())) {
  console.error(
    `No full-node client certificate under ${join(root, "config", "ssl", "full_node")}.\n` +
      "Set CHIA_ROOT to your node's root (e.g. ~/.chia/testnet11 or a Docker volume)."
  );
  process.exit(1);
}
const tls = { cert: await cert.text(), key: await key.text(), rejectUnauthorized: false };

const server = Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    const decision = decide({ method: request.method, pathname: url.pathname, origin });
    const cors = corsHeaders(origin);
    if (decision.kind === "preflight") return new Response(null, { status: 204, headers: cors });
    if (decision.kind === "reject") {
      console.log(`${request.method} ${url.pathname} → ${decision.status} (${decision.reason})`);
      return Response.json(
        { success: false, error: decision.reason },
        {
          status: decision.status,
          headers: cors,
        }
      );
    }
    const started = performance.now();
    try {
      // The node's certificate is self-signed by its private CA: its identity is not checked
      // here, the connection only has to reach the local node with the client certificate.
      const upstream = await fetch(`${node}/${decision.method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: await request.text(),
        tls,
      } as RequestInit);
      const body = await upstream.arrayBuffer();
      console.log(
        `${decision.method} → ${upstream.status} ${Math.round(performance.now() - started)} ms`
      );
      return new Response(body, {
        status: upstream.status,
        headers: { "content-type": "application/json", ...cors },
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`${decision.method} → 502 (${reason})`);
      return Response.json(
        { success: false, error: `node unreachable at ${node}: ${reason}` },
        { status: 502, headers: cors }
      );
    }
  },
});

console.log(`Forwarding http://${server.hostname}:${server.port} → ${node} (certs from ${root})`);
console.log(`Settings → Full-node RPC endpoints: http://127.0.0.1:${server.port}`);
