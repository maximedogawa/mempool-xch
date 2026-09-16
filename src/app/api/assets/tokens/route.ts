import { NextResponse } from "next/server";
import { getTokenRegistry } from "@/server/tokenList";

export const dynamic = "force-dynamic";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** The CAT token registry (name, ticker, icon per asset id), cached server-side. */
export async function GET() {
  const { tokens, fetchedAt, stale } = await getTokenRegistry().get();
  if (Object.keys(tokens).length === 0) {
    return NextResponse.json({ error: "token list unavailable" }, { status: 503, headers: { ...CORS, "cache-control": "no-store" } });
  }
  return NextResponse.json(
    { fetchedAt, stale, tokens },
    { headers: { ...CORS, "cache-control": "public, max-age=3600, stale-while-revalidate=21600" } }
  );
}
