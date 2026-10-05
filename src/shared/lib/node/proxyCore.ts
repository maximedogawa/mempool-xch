/**
 * Request handling of the dev proxy (scripts/node/proxy.ts), kept free of I/O so it can be
 * unit-tested. The proxy lets a browser reach a local full node: it forwards an allowlist of
 * methods, and only answers pages from localhost or mempoolxch.space, so another site open in
 * the same browser cannot drive the node (stop_node and the other admin methods stay closed).
 */
import { STANDARD_METHODS, type StandardMethod } from "./methods";

const ALLOWED = new Set<string>(STANDARD_METHODS);

/** Pages that may call the proxy: any localhost port (dev servers, the Sage snapshot server) and
 *  the hosted site. */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // curl, the probe: no browser, no cross-site risk
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]")
      return true;
    return url.protocol === "https:" && url.hostname === "mempoolxch.space";
  } catch {
    return false;
  }
}

/** The RPC method a request path names, if the proxy forwards it: "/get_block" → "get_block". */
export function methodOf(pathname: string): StandardMethod | null {
  const name = pathname.replace(/^\/+|\/+$/g, "");
  return ALLOWED.has(name) ? (name as StandardMethod) : null;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !isAllowedOrigin(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export type Decision =
  | { kind: "preflight"; status: 204 }
  | { kind: "reject"; status: 403 | 404 | 405; reason: string }
  | { kind: "forward"; method: StandardMethod };

/** What to do with an incoming request, before anything is sent to the node. */
export function decide(request: {
  method: string;
  pathname: string;
  origin: string | null;
}): Decision {
  if (!isAllowedOrigin(request.origin))
    return { kind: "reject", status: 403, reason: "origin not allowed" };
  if (request.method === "OPTIONS") return { kind: "preflight", status: 204 };
  if (request.method !== "POST")
    return { kind: "reject", status: 405, reason: "only POST is forwarded" };
  const method = methodOf(request.pathname);
  if (!method) return { kind: "reject", status: 404, reason: "method not forwarded" };
  return { kind: "forward", method };
}
