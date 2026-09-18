"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { openExternalUrl } from "@/shared/lib/sage/bridge";
import { isSageRuntime } from "@/shared/lib/sage/mappers";

/** Ordinary new-tab anchor in a browser; inside Sage the URL goes through environment.openExternalUrl. */
export function ExternalLink({
  href,
  onClick,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isSageRuntime()) return;
    event.preventDefault();
    void openExternalUrl(href);
  };
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
