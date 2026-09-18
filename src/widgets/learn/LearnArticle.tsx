import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/shared/lib/routes";
import { articleBySlug, LEARN_ARTICLES, learnHref } from "./articles";

/** Shared frame for a Learn article: breadcrumb, title, prose, previous/next links. */
export function LearnArticle({ slug, children }: { slug: string; children: ReactNode }) {
  const index = LEARN_ARTICLES.findIndex((a) => a.slug === slug);
  const meta = articleBySlug(slug);
  const prev = index > 0 ? LEARN_ARTICLES[index - 1] : undefined;
  const next = index >= 0 ? LEARN_ARTICLES[index + 1] : undefined;
  if (!meta) return null;
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href={routes.learn()} className="hover:text-fg">
          Learn
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-fg">{meta.title}</span>
      </nav>
      <header>
        <h1 className="text-2xl font-semibold">{meta.title}</h1>
        <p className="mt-2 text-sm text-fg-muted">{meta.summary}</p>
        <p className="mt-1 text-xs text-fg-faint">{meta.minutes} min read</p>
      </header>
      <div className="flex flex-col gap-5 text-sm leading-relaxed text-fg-muted [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-fg [&_strong]:text-fg [&_a]:text-accent [&_a:hover]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_code]:mono [&_code]:text-xs">
        {children}
      </div>
      <nav
        aria-label="More articles"
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm"
      >
        {prev ? (
          <Link href={learnHref(prev.slug)} className="text-accent hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={learnHref(next.slug)} className="text-accent hover:underline">
            {next.title} →
          </Link>
        ) : (
          <Link href={routes.learn()} className="text-accent hover:underline">
            All articles →
          </Link>
        )}
      </nav>
    </article>
  );
}
