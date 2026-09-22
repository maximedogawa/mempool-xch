"use client";

import { useT } from "@/shared/i18n/useT";

/** First focusable element on every page: jumps keyboard users past the header to <main>. */
export function SkipLink() {
  const t = useT("shell");
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
    >
      {t("skipToContent")}
    </a>
  );
}
