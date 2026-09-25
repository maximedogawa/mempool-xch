/**
 * Human wording for the live channel a tab is on: the pill tooltip, the footer and
 * the settings page all use the same description so the user sees the same words everywhere.
 */
import { plainT } from "@/shared/i18n/plain";
import type { Provider } from "@/shared/config/networks";
import type { LiveStatus, LiveTransport } from "./stream";
import commonNs from "@/shared/i18n/messages/en/common";

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
  /** Who answers; without it, `isCoinset` decides between Coinset and a custom node. */
  provider?: Provider;
}

const host = (url: string) => {
  try {
    return new URL(url, "https://mempoolxch.space").host;
  } catch {
    return url;
  }
};

export function describeChannel(input: ChannelInput): ChannelDescription {
  const t = plainT(commonNs);
  const rpcHost = host(input.rpcUrl);
  const provider: Provider = input.provider ?? (input.isCoinset ? "coinset" : "custom");
  const nodexch = provider === "nodexch";
  if (provider === "custom") {
    return {
      name: t("channel.customName"),
      detail: t("channel.customDetail", { host: rpcHost }),
    };
  }
  if (input.status === "offline")
    return {
      name: t("channel.offlineName"),
      detail: t("channel.offlineDetail", { host: rpcHost }),
    };
  if (input.transport === "websocket" && input.wsUrl) {
    const wsHost = host(input.wsUrl);
    return input.status === "live"
      ? {
          name: t(nodexch ? "channel.nodexchSocketName" : "channel.socketName"),
          detail: t("channel.socketDetail", { host: wsHost }),
        }
      : {
          name: t(nodexch ? "channel.nodexchReconnectingName" : "channel.reconnectingName"),
          detail: t("channel.reconnectingDetail", { host: wsHost }),
        };
  }
  return { name: t("channel.pollingName"), detail: t("channel.pollingDetail", { host: rpcHost }) };
}
