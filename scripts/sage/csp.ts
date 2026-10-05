/**
 * The Content-Security-Policy Sage puts on every response from the app protocol.
 *
 * Mirrored from `crates/sage-apps/src/security/csp.rs` (xch-dev/sage, Sage 0.13.0):
 * `connect-src` gains the granted network whitelist for the active network, `img-src`
 * gains its https entries, and nothing else varies. In particular Sage's `media-src` is
 * 'self' data: blob:, so a video NFT hosted on IPFS plays only in the hosted build and falls
 * back to its still thumbnail inside Sage; `mediaSrcExtra` is for the hosted policy alone. Used by the local snapshot server
 * and by the Playwright CSP check so the snapshot is exercised under the real policy.
 */

import { TRUSTED_IMAGE_HOSTS } from "../../src/shared/lib/trustedImage";
import { whitelistForNetwork, type SageManifest } from "./manifestSchema";

export function buildAppCsp(
  whitelist: string[] = [],
  opts: {
    scriptSrcExtra?: string[];
    mediaSrcExtra?: string[];
    prefetchSrc?: boolean;
    frameAncestors?: string;
  } = {}
): string {
  const connectSrc = ["'self'", ...whitelist].join(" ");
  const imgSrc = [
    "'self'",
    "blob:",
    "data:",
    ...whitelist.filter((e) => e.startsWith("https://")),
  ].join(" ");
  const scriptSrc = ["'self'", "'wasm-unsafe-eval'", ...(opts.scriptSrcExtra ?? [])].join(" ");

  return [
    "child-src 'none'",
    `connect-src ${connectSrc}`,
    "default-src 'self'",
    "font-src 'self' data:",
    "frame-src 'none'",
    `img-src ${imgSrc}`,
    "manifest-src 'none'",
    `media-src ${["'self'", "data:", "blob:", ...(opts.mediaSrcExtra ?? [])].join(" ")}`,
    "object-src 'none'",
    // Chrome dropped prefetch-src and logs it as an error on every page; Sage's webview still takes it.
    ...(opts.prefetchSrc === false ? [] : ["prefetch-src 'none'"]),
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${opts.frameAncestors ?? "'self'"}`,
  ].join("; ");
}

/** CSP for a manifest as installed on one Sage network (all whitelist entries granted). */
export function buildAppCspForManifest(manifest: SageManifest, networkId = "mainnet"): string {
  return buildAppCsp(whitelistForNetwork(manifest, networkId));
}

/**
 * CSP for the standard hosted build, not the Sage snapshot. Two deliberate departures
 * from Sage's stricter policy, both required by things the static Sage export doesn't have to
 * deal with:
 *
 * 1. connect-src is broadened to any https/wss origin rather than a fixed host list. Unlike
 *    Sage — whose manifest whitelist is a fixed set granted once at install — the hosted app
 *    supports a user-configured custom node (Settings → any https/wss RPC URL), which a static
 *    per-request header can never predict; a strict whitelist would break that already-shipped
 *    feature. Plain http is only allowed for localhost, where Settings tells own-node users to
 *    run their CORS reverse proxy. img-src stays exactly as strict as Sage's either way (reuses trustedImage.ts's
 *    TRUSTED_IMAGE_HOSTS, the same allowlist the components enforce client-side).
 * 2. script-src gains 'unsafe-inline'. Next's standalone SSR output (this build) injects inline
 *    bootstrap/hydration scripts on every response; the static Sage export doesn't need this
 *    (scripts/sage/externalize-inline-scripts.ts strips them at build time, a one-time
 *    post-process that has no equivalent for a live per-request SSR response). The alternative
 *    is a per-request nonce threaded through Next's own middleware/proxy layer — real, more
 *    correct, and more invasive than this task's scope; noted as follow-up, not attempted here.
 *    The residual risk 'unsafe-inline' leaves open is XSS via inline script injection; this app
 *    has no dangerouslySetInnerHTML anywhere (verified 2026-09-17), so there's no known sink for
 *    it to matter against today.
 */
export function buildHostedAppCsp(opts: { frameAncestors?: string } = {}): string {
  const localNode = [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "ws://localhost:*",
    "ws://127.0.0.1:*",
  ];
  const imageHosts = [...TRUSTED_IMAGE_HOSTS].map((host) => `https://${host}`);
  return buildAppCsp(["https:", "wss:", ...localNode, ...imageHosts], {
    scriptSrcExtra: ["'unsafe-inline'"],
    // NFT artwork is not always a still: video data_uris live on the same trusted hosts.
    mediaSrcExtra: imageHosts,
    prefetchSrc: false,
    frameAncestors: opts.frameAncestors,
  });
}

/**
 * The embeds under /embed are meant to be iframed by other sites, so they alone allow any
 * frame ancestor; the rest of the app keeps 'self'. Next applies the later header entry when
 * two match, which is why next.config.ts lists the /embed rule after the catch-all.
 */
export function buildEmbedCsp(): string {
  return buildHostedAppCsp({ frameAncestors: "*" });
}
