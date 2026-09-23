import Link from "next/link";
import type { ReactNode } from "react";
import type { RichTag } from "@/shared/i18n/translate";

/** Inline markup shared by every Learn article's rich messages. */
export const PROSE_TAGS: Record<string, RichTag> = {
  strong: (c) => <strong>{c}</strong>,
  em: (c) => <em>{c}</em>,
  code: (c) => <code>{c}</code>,
};

/** A rich-text tag that renders its content as an in-app link. */
export function linkTag(href: string): RichTag {
  return function LinkTag(c: ReactNode) {
    return <Link href={href}>{c}</Link>;
  };
}
