/**
 * Route helpers (decision-004). The hosted server rewrites pretty URLs (`/tx/<id>`) onto
 * query-param pages (`/tx?id=<id>`); the static Sage export has no rewrites, so links there use
 * the query form directly. Every link in the app goes through these helpers.
 */
const QUERY_ROUTES = process.env.NEXT_PUBLIC_SAGE_BUILD === "1";

function detail(base: string, id: string): string {
  const clean = encodeURIComponent(id);
  return QUERY_ROUTES ? `/${base}?id=${clean}` : `/${base}/${clean}`;
}

function page(path: string): string {
  return `/${path}`;
}

/**
 * Inside Sage the webview URL can read `/index.html` or `/blocks.html` (static-export files);
 * normalise before comparing with a route.
 */
export function normalisePath(pathname: string): string {
  const stripped = pathname.replace(/\.html?$/i, "").replace(/\/+$/, "");
  return stripped === "" || stripped === "/index" ? "/" : stripped;
}

export const routes = {
  home: () => "/",
  tx: (id: string) => detail("tx", id),
  block: (heightOrHash: number | string) => detail("block", String(heightOrHash)),
  address: (address: string) => detail("address", address),
  coin: (id: string) => detail("coin", id),
  cat: (assetId: string) => detail("cat", assetId),
  nft: (nftId: string) => detail("nft", nftId),
  blocks: () => page("blocks"),
  mempool: () => page("mempool"),
  settings: () => page("settings"),
  docs: () => page("docs"),
};
