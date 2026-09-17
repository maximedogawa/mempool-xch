import { NextResponse, type NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * Serves the Sage static snapshot (`bun run build:sage` → out/, copied to ./sage-snapshot in
 * the Docker image) from the same origin as the hosted app, so the hosted URL doubles as the
 * Sage "Install from URL" target (same design as Pengui). Only paths listed in the snapshot's
 * sage-manifest.json are served; everything else falls through to the normal app. The
 * snapshot's `_next/static/<hash>/…` files never clash with the hosted build's because every
 * build has its own hash.
 *
 * The turbopackIgnore comments keep Next's output file tracing away from these reads: it cannot
 * resolve a runtime path, so it would copy the whole repository into .next/standalone (and the
 * Docker image). The snapshot is not traced output anyway; the Dockerfile copies it in.
 */
const SNAPSHOT_DIR = resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.SAGE_SNAPSHOT_DIR || "sage-snapshot");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

let servable: ReadonlySet<string> | undefined;

function servablePaths(): ReadonlySet<string> {
  if (servable) return servable;
  try {
    const manifest = JSON.parse(readFileSync(join(/*turbopackIgnore: true*/ SNAPSHOT_DIR, "sage-manifest.json"), "utf8")) as { files?: { path: string }[] };
    const paths = new Set<string>(["sage-manifest.json", ...(manifest.files ?? []).map((f) => f.path)]);
    servable = paths;
    return paths;
  } catch {
    return new Set();
  }
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/+/, "");
  if (path === "" || !servablePaths().has(path)) return NextResponse.next();
  try {
    const body = readFileSync(join(/*turbopackIgnore: true*/ SNAPSHOT_DIR, path));
    const dot = path.lastIndexOf(".");
    const type = dot === -1 ? "application/octet-stream" : (MIME[path.slice(dot)] ?? "application/octet-stream");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": type,
        "access-control-allow-origin": "*",
        "cache-control": path === "sage-manifest.json" ? "no-cache" : "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/sage-manifest.json", "/((?!api/|up$).*\\.(?:html|js|css|json|txt|png|svg|ico|woff2))"],
};
