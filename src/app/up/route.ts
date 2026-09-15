import { NextResponse } from "next/server";

// Health check required by ONCE (https://github.com/basecamp/once): plain HTTP 200 on /up.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "up" }, { status: 200 });
}
