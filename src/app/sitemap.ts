import type { MetadataRoute } from "next";

const siteUrl = "https://mempoolxch.space";

const pages = [
  "",
  "/mempool",
  "/blocks",
  "/fees",
  "/charts",
  "/tokens",
  "/nfts",
  "/nfts/activity",
  "/nfts/collections",
  "/nfts/mints",
  "/pools",
  "/map",
  "/prefarm",
  "/vaults",
  "/status",
  "/api",
  "/docs",
  "/gaming",
  "/changelog",
  "/learn",
  "/learn/what-is-chia",
  "/learn/what-is-the-mempool",
  "/learn/proof-of-space-and-time",
  "/learn/farming-and-plotting",
  "/learn/offers-and-trading",
  "/learn/questions",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/notice",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));
}
