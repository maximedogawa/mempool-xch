/**
 * Route helpers (decision-004). The hosted server rewrites pretty URLs (`/tx/<id>`) onto
 * query-param pages (`/tx?id=<id>`); the static Sage export has no rewrites, so links there use
 * the query form directly. Every link in the app goes through these helpers.
 */
const QUERY_ROUTES = process.env.NEXT_PUBLIC_SAGE_BUILD === "1";

function detail(base: string, id: string): string {
  const clean = encodeURIComponent(id);
  return QUERY_ROUTES ? `/${base}/?id=${clean}` : `/${base}/${clean}`;
}

function page(path: string): string {
  return QUERY_ROUTES ? `/${path}/` : `/${path}`;
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
