/** Settings form: network, endpoints, appearance and language (src/features/settings). */
const messages = {
  title: "Settings",
  channel:
    "<strong>Live channel: {name}.</strong> {detail} Everything is read from the endpoint directly.",
  network: {
    title: "Network",
    active: "Active network",
    intro:
      "The whole app follows the active network: address prefixes, explorer links, the live stream and the mempool summary. Active endpoint: <endpoint>{url}</endpoint>",
  },
  endpoints: {
    title: "Full-node RPC endpoints",
    sage: "<strong>Inside Sage:</strong> your balance, coins and transactions come from the wallet itself. Sage's app bridge has no node RPC (no peak, mempool or block queries), so chain-wide data comes from the endpoint below; a custom endpoint is whitelisted in Sage when you save it.",
    intro:
      "By default mempoolxch.space reads the chain through <coinset>Coinset</coinset>'s public full-node RPC, so no own node is needed, straight from your browser. You can point each network at any Chia full-node-RPC-compatible HTTPS endpoint instead. Coinset-only features (semantic transaction summaries, address history and the WebSocket stream) switch off automatically for custom endpoints and the app falls back to polling and to fetching the raw mempool in the browser.",
    ownNode:
      "<strong>Using your own node?</strong> A stock Chia full node listens on <code>https://localhost:8555</code> with mutual TLS: it requires the node's client certificate, which a browser cannot present, and it sends no CORS headers. Put a small reverse proxy in front of it that terminates TLS with the client certificate and adds <code>Access-Control-Allow-Origin</code>, then enter the proxy URL here. <guide>Step-by-step guide</guide>.",
  },
  endpoint: {
    addresses: "({prefix} addresses)",
    coinsetDefault: "Coinset default",
    customNode: "Custom node",
    test: "Test connection",
    save: "Save",
    reset: "Reset to Coinset",
    ok: "Peak {height} in {ms} ms",
    okCustom: "Peak {height} in {ms} ms · custom node: indexed API, WebSocket and summary API off",
    sageHttpsOnly: "Inside Sage only https endpoints can be whitelisted.",
    sageRefused: "Sage did not allow this host; the endpoint was not saved.",
    sageAllowed: "Sage allowed this host.",
  },
  appearance: {
    title: "Appearance",
    theme: "Theme",
    dark: "Dark",
    darkHint: "mempool.space style",
    light: "Light",
    lightHint: "bright and crisp",
    system: "System",
    systemHint: "follows your device",
    sageLocked:
      "Inside Sage the app follows the wallet's theme (currently {theme}). Change it in Sage's settings.",
    language: "Language",
    languageAuto: "Automatic (browser language)",
    chime: "Confirmation chime",
    chimeHint:
      "A soft coin sound when one of your wallet's transactions lands in a block (Sage only).",
    recentBlocks: "Recent blocks on the dashboard",
  },
  resetAll: "Reset all settings",
};

export default messages;
