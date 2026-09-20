"use client";

/**
 * Thin, lazy access to the sage-app-sdk client. The SDK is imported only inside Sage so the
 * browser bundle never pays for it, and every call is best-effort: a missing capability or a
 * bridge failure resolves to null instead of throwing into the UI.
 */
import type { NetworkId } from "@/shared/config/networks";
import { browserStorage } from "@/shared/lib/browserStorage";
import { CapabilityManager, type CapabilityClient } from "./capabilities";
import { isSageRuntime, mapSageNetwork, mapSageTheme, receiveAddressFrom } from "./mappers";

type SageSdk = typeof import("sage-app-sdk");
type SageClient = Awaited<ReturnType<SageSdk["getSageClient"]>>;

let clientPromise: Promise<SageClient | null> | null = null;

export function getSage(): Promise<SageClient | null> {
  if (!isSageRuntime()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = (async () => {
      try {
        const sdk = await import("sage-app-sdk");
        sdk.initSageRuntimeBridge();
        return await sdk.getSageClient();
      } catch {
        clientPromise = null;
        return null;
      }
    })();
  }
  return clientPromise;
}

export async function fetchSageNetwork(): Promise<NetworkId | null> {
  const client = await getSage();
  if (!client) return null;
  try {
    return mapSageNetwork(await client.environment.getNetwork());
  } catch {
    return null;
  }
}

export async function fetchSageTheme(): Promise<"light" | "dark" | null> {
  const client = await getSage();
  if (!client) return null;
  try {
    return mapSageTheme((await client.environment.theme.getCurrent()).theme);
  } catch {
    return null;
  }
}

export async function listenSageTheme(
  handler: (theme: "light" | "dark") => void
): Promise<() => void> {
  const client = await getSage();
  if (!client) return () => {};
  try {
    return client.environment.theme.onChanged((event) => handler(mapSageTheme(event.theme)));
  } catch {
    return () => {};
  }
}

/** Process-wide capability manager bound to the Sage client (asks once, remembers refusals). */
export const capabilities = new CapabilityManager(
  () => getSage() as Promise<CapabilityClient | null>,
  browserStorage()
);

/** Receive address of the connected wallet once wallet.get_sync_status is granted; null otherwise. */
export async function fetchSageWalletAddress(): Promise<string | null> {
  const client = await getSage();
  if (!client) return null;
  if (!(await capabilities.ensure("wallet.get_sync_status"))) return null;
  try {
    return receiveAddressFrom(await client.wallet.getSyncStatus());
  } catch {
    return null;
  }
}

/**
 * Open a URL outside the app. Inside Sage window.open is blocked by the webview policy, so the
 * bridge's environment.openExternalUrl is used when the host offers it. Returns whether the URL
 * was handed off.
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  if (!isSageRuntime()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }
  const client = await getSage();
  const environment = client?.environment as unknown as
    { openExternalUrl?: (input: { url: string }) => Promise<unknown> } | undefined;
  if (!environment?.openExternalUrl) return false;
  try {
    await environment.openExternalUrl({ url });
    return true;
  } catch {
    return false;
  }
}
