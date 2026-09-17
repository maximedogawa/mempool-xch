/**
 * Human wording for the live channel a tab is on: the pill tooltip, the footer and
 * the settings page all use the same description so the user sees the same words everywhere.
 */
import type { LiveStatus, LiveTransport } from "./stream";

export interface ChannelDescription {
  /** Short name, e.g. "Server events". */
  name: string;
  /** One sentence with the endpoint. */
  detail: string;
}

export interface ChannelInput {
  status: LiveStatus;
  transport: LiveTransport;
  rpcUrl: string;
  wsUrl: string | null;
  isCoinset: boolean;
}

const host = (url: string) => {
  try {
    return new URL(url, "https://mempoolxch.space").host;
  } catch {
    return url;
  }
};

export function describeChannel(input: ChannelInput): ChannelDescription {
  const rpcHost = host(input.rpcUrl);
  if (!input.isCoinset) {
    return { name: "Polling (custom node)", detail: `Polling your node at ${rpcHost} every few seconds; no stream, mempool fetched in the browser.` };
  }
  if (input.status === "offline") return { name: "Offline", detail: `No connection to ${rpcHost}.` };
  if (input.transport === "websocket" && input.wsUrl) {
    return input.status === "live"
      ? { name: "Coinset socket", detail: `Streaming peak and transaction events from ${host(input.wsUrl)} directly.` }
      : { name: "Coinset socket (reconnecting)", detail: `Reconnecting to ${host(input.wsUrl)}.` };
  }
  return { name: "Polling", detail: `Polling ${rpcHost} every few seconds.` };
}
