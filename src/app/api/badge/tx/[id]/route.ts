import { NextResponse } from "next/server";

/**
 * SVG status badge for a transaction, for READMEs and pages that can only embed an <img>:
 * one Coinset lookup per request, no state, cached by the browser or CDN for a minute. The
 * only server-side read in the app; excluded from the Sage export like every route handler.
 */
export const dynamic = "force-dynamic";

const COINSET: Record<string, string> = { mainnet: "https://api.coinset.org", testnet11: "https://testnet11.api.coinset.org" };
const COLOUR: Record<string, string> = { confirmed: "#3aac59", pending: "#d9a400", removed: "#e0505c", "not found": "#67708f", invalid: "#67708f" };

function badge(label: string, status: string): string {
  const colour = COLOUR[status] ?? COLOUR.invalid!;
  const left = 7 * label.length + 12;
  const right = 7 * status.length + 12;
  const width = left + right;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${status}">
<title>${label}: ${status}</title>
<clipPath id="r"><rect width="${width}" height="20" rx="4"/></clipPath>
<g clip-path="url(#r)"><rect width="${left}" height="20" fill="#1c2033"/><rect x="${left}" width="${right}" height="20" fill="${colour}"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
<text x="${left / 2}" y="14">${label}</text><text x="${left + right / 2}" y="14" font-weight="bold">${status}</text></g></svg>`;
}

async function status(base: string, id: string): Promise<string> {
  const post = (method: string, body: unknown) =>
    fetch(`${base}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8_000) })
      .then((r) => (r.ok ? (r.json() as Promise<Record<string, unknown>>) : null))
      .catch(() => null);
  const [mempool, tx] = await Promise.all([post("get_mempool_item_by_tx_id", { tx_id: `0x${id}` }), post("get_transaction", { tx_id: id })]);
  const summary = tx?.transaction as { status?: string } | null | undefined;
  if (summary?.status === "confirmed") return "confirmed";
  if (mempool?.mempool_item) return "pending";
  if (summary?.status === "removed") return "removed";
  if (summary) return "pending";
  return "not found";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = raw.replace(/\.svg$/i, "").replace(/^0x/i, "").toLowerCase();
  const network = new URL(request.url).searchParams.get("network") === "testnet11" ? "testnet11" : "mainnet";
  const valid = /^[0-9a-f]{64}$/.test(id);
  const state = valid ? await status(COINSET[network]!, id) : "invalid";
  return new NextResponse(badge("chia tx", state), {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": valid ? "public, max-age=60" : "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
