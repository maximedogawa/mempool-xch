import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import packageJson from "./package.json";

function getCommitSha(): string {
  if (process.env.NEXT_PUBLIC_COMMIT_SHA) return process.env.NEXT_PUBLIC_COMMIT_SHA;
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * Two outputs from one code base (decision-004):
 *  - default: `output: "standalone"` server for the Docker image (rewrites give pretty URLs);
 *  - SAGE_BUILD=1: `output: "export"` static snapshot for the Sage wallet (no server, no rewrites,
 *    every page is a real file and detail pages take their id from the query string).
 */
const isSageBuild = process.env.SAGE_BUILD === "1";

const nextConfig: NextConfig = {
  output: isSageBuild ? "export" : "standalone",
  ...(isSageBuild ? { images: { unoptimized: true }, pageExtensions: ["tsx", "jsx"] } : {}),
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: __dirname },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query", "clsx", "tailwind-merge"],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_COMMIT_SHA: getCommitSha(),
  },
  ...(isSageBuild
    ? {}
    : {
        async rewrites() {
          // Pretty explorer URLs (mempool.space style) map onto query-param pages so the same
          // pages also work in the static Sage export, which cannot rewrite.
          return [
            { source: "/tx/:id", destination: "/tx?id=:id" },
            { source: "/block/:id", destination: "/block?id=:id" },
            { source: "/address/:id", destination: "/address?id=:id" },
            { source: "/coin/:id", destination: "/coin?id=:id" },
            { source: "/cat/:id", destination: "/cat?id=:id" },
            { source: "/nft/:id", destination: "/nft?id=:id" },
          ];
        },
        async headers() {
          if (process.env.NODE_ENV !== "production") return [];
          return [
            {
              source: "/:all*(svg|jpg|png|webp|avif|ico|woff|woff2)",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
            {
              source: "/_next/static/:path*",
              headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
            },
          ];
        },
      }),
};

export default nextConfig;
