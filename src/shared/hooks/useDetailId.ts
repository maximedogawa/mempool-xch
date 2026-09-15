"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Id of a detail page. The hosted server rewrites `/tx/<id>` to `/tx?id=<id>` internally, so the
 * browser URL keeps the pretty form and `useSearchParams` sees no `id`; the static Sage export
 * links to `/tx?id=<id>` directly. Read both: query first, then the last pathname segment.
 */
export function useDetailId(base: string): string | null {
  const params = useSearchParams();
  const pathname = usePathname() ?? "";
  const fromQuery = params.get("id");
  if (fromQuery) return fromQuery.trim();
  const match = new RegExp(`^/${base}/([^/]+)/?$`).exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]).trim() : null;
}
