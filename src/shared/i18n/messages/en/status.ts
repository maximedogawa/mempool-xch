/** Status page: health of the services the site depends on (src/widgets/status). */
import { defineNamespace } from "../../translate";

const messages = {
  title: "Status",
  tooltip:
    "Measured from your browser right now, the same way the pages fetch their data. There is no server-side monitor and no history; a red row means your connection cannot reach that service at the moment.",
  health: {
    ok: "Operational",
    degraded: "Degraded",
    down: "Unreachable",
    checking: "Checking",
  },
  overall: {
    ok: "All services reachable",
    degraded: "Some services are slow or degraded",
    down: "Some services are unreachable",
  },
  checked: "checked {age} · re-checks every minute",
  checking: "checking…",
  checkAgain: "Check again",
  services: "Services",
  serviceList: "Service status",
  latency: "{ms} ms",
  names: {
    coinsetRpc: "Coinset full-node RPC",
    ownNode: "Your node (full-node RPC)",
    nodexch: "nodexch gateway (full-node RPC and indexed API)",
    indexed: "Coinset indexed API",
    live: "Live stream",
    dns: "Chia DNS introducers",
  },
  what: {
    noIndexed: "not available on a custom node",
    pollingOnly: "polling only",
    viaDns: "via cloudflare-dns.com",
  },
  detail: {
    synced: "synced · peak #{height}",
    notSynced: "not synced · peak #{height}",
    lastReorg: "last reorg {age}",
    answering: "answering",
    dexie: "token registry answering",
    mintgarden: "NFT API answering",
    seeder: { one: "{seeder}: {count} node", other: "{seeder}: {count} nodes" },
    geo: "geolocation answering",
    geoNoLocation: "answered without a location",
  },
  live: {
    state: {
      live: "live",
      polling: "polling",
      connecting: "connecting",
      offline: "offline",
    },
    websocket: "{state} over websocket",
    viaPolling: "{state} via polling",
    lastEvent: " · last event {age}",
    peak: " · peak #{height}",
  },
  footnote:
    "The site itself is a static app served from mempoolxch.space (health endpoint <code>/up</code>); everything else is fetched by your browser from the services above. Coinset publishes its own status independently of this page.",
};

export default defineNamespace("status", messages);
