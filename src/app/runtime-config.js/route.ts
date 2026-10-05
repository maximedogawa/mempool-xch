import { runtimeConfigFromEnv, runtimeConfigScript } from "@/shared/config/runtime";

// Read from the container's environment on every request, never at build time (see
// src/shared/config/runtime.ts). Not part of the Sage export, which compiles no route handler.
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(runtimeConfigScript(runtimeConfigFromEnv(process.env)), {
    status: 200,
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      // Every page load waits for this file: let the browser keep it for a few minutes.
      "cache-control": "public, max-age=300",
    },
  });
}
