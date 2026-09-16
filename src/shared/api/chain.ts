/**
 * Hosted chain cache (/api/<network>/chain): state, recent blocks and the reference fee in
 * one small response, refreshed on the server from hub events (decision-006). Several hooks
 * read it at the same moment, so one fetch per second per URL is shared.
 */
import type { ChainSnapshot } from "@/shared/lib/chain/types";
import { RpcError } from "@/shared/lib/rpc/errors";
import { parseJsonSafe } from "@/shared/lib/rpc/json";

const inflight = new Map<string, { at: number; promise: Promise<ChainSnapshot> }>();
const SHARE_MS = 800;

export async function fetchChainSnapshot(url: string, _signal?: AbortSignal, fetchImpl: typeof fetch = fetch, fresh = false): Promise<ChainSnapshot> {
  const cached = inflight.get(url);
  if (!fresh && cached && Date.now() - cached.at < SHARE_MS) return cached.promise;
  // Deliberately no abort signal: the promise is shared between hooks, and one unmounting
  // caller must not turn everyone else's result into a network error (→ RPC fallback).
  const promise = (async () => {
    let response: Response;
    try {
      response = await fetchImpl(url);
    } catch (error) {
      throw new RpcError("network", "chain", "Chain API unreachable", { detail: error });
    }
    if (!response.ok) throw new RpcError("http", "chain", `Chain API answered ${response.status}`, { status: response.status });
    try {
      return parseJsonSafe(await response.text()) as ChainSnapshot;
    } catch (error) {
      throw new RpcError("malformed", "chain", "Malformed chain snapshot", { detail: error });
    }
  })();
  inflight.set(url, { at: Date.now(), promise });
  promise.catch(() => inflight.delete(url));
  return promise;
}

/** Errors after which the browser should fall back to calling the RPC itself. */
export function isChainFallbackError(error: unknown): boolean {
  return error instanceof RpcError && (error.kind === "http" || error.kind === "network" || error.kind === "malformed");
}
