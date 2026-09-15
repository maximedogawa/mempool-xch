/**
 * Pure helpers for the Sage wallet runtime (TASK-019): host detection and the mapping of Sage's
 * network, theme and sync status onto the app's own settings. No transport here, so everything
 * is unit-testable without a fake window.__SAGE__.
 */
import type { NetworkId } from "@/shared/config/networks";

interface SageGlobals {
  __TAURI__?: unknown;
  __SAGE__?: unknown;
}

/** Synchronous, side-effect free: Sage's shell exposes __TAURI__; the SDK creates __SAGE__. */
export function isSageRuntime(globals: unknown = typeof window !== "undefined" ? window : undefined): boolean {
  if (!globals || typeof globals !== "object") return false;
  const g = globals as SageGlobals;
  return g.__TAURI__ != null || g.__SAGE__ != null;
}

export interface SageNetworkLike {
  kind?: string;
  networkId?: string;
  name?: string;
  prefix?: string;
}

/** Sage reports mainnet / testnet / unknown; the app knows mainnet and testnet11. */
export function mapSageNetwork(result: SageNetworkLike): NetworkId {
  if (result.kind === "mainnet") return "mainnet";
  if (result.kind === "testnet") return "testnet11";
  const hint = `${result.networkId ?? ""} ${result.name ?? ""} ${result.prefix ?? ""}`.toLowerCase();
  return hint.includes("testnet") || hint.includes("txch") ? "testnet11" : "mainnet";
}

export interface SageThemeLike {
  name?: string;
  displayName?: string;
  mostLike?: string | null;
  inherits?: string | null;
}

/** Map a Sage theme onto the app's light/dark tokens; the app default is dark. */
export function mapSageTheme(theme: SageThemeLike): "light" | "dark" {
  const hint = theme.mostLike?.toLowerCase() ?? theme.inherits?.toLowerCase();
  if (hint === "light" || hint === "dark") return hint;
  const name = `${theme.name ?? ""} ${theme.displayName ?? ""}`.toLowerCase();
  return name.includes("light") ? "light" : "dark";
}

/** The wallet's receive address from wallet.get_sync_status, or null when absent. */
export function receiveAddressFrom(status: unknown): string | null {
  if (!status || typeof status !== "object") return null;
  const address = (status as { receive_address?: unknown }).receive_address;
  return typeof address === "string" && /^t?xch1[a-z0-9]{50,}$/i.test(address) ? address.toLowerCase() : null;
}
