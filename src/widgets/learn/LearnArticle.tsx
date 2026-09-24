"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { articleBySlug, LEARN_ARTICLES, learnHref } from "./articles";
import learnNs from "@/shared/i18n/messages/en/learn";

/** Shared frame for a Learn article: breadcrumb, title, prose, previous/next links. */
export function LearnArticle({ slug, children }: { slug: string; children: ReactNode }) {
  const t = useT(learnNs);
  const index = LEARN_ARTICLES.findIndex((a) => a.slug === slug);
  const meta = articleBySlug(slug);
  const prev = index > 0 ? LEARN_ARTICLES[index - 1] : undefined;
  const next = index >= 0 ? LEARN_ARTICLES[index + 1] : undefined;
  if (!meta) return null;
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav aria-label={t("article.breadcrumb")} className="text-sm text-fg-muted">
        <Link href={routes.learn()} className="hover:text-fg">
          {t("article.learn")}
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-fg">{t(`${meta.key}.title`)}</span>
      </nav>
      <header>
        <h1 className="text-2xl font-semibold">{t(`${meta.key}.title`)}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t(`${meta.key}.summary`)}</p>
        <p className="mt-1 text-xs text-fg-faint">
          {t("article.minRead", { minutes: meta.minutes })}
        </p>
      </header>
      <div className="flex flex-col gap-5 text-sm leading-relaxed text-fg-muted [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-fg [&_strong]:text-fg [&_a]:text-accent [&_a:hover]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_code]:mono [&_code]:text-xs">
        {children}
      </div>
      <nav
        aria-label={t("article.moreArticles")}
        className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm"
      >
        {prev ? (
          <Link href={learnHref(prev.slug)} className="text-accent hover:underline">
            ← {t(`${prev.key}.title`)}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={learnHref(next.slug)} className="text-accent hover:underline">
            {t(`${next.key}.title`)} →
          </Link>
        ) : (
          <Link href={routes.learn()} className="text-accent hover:underline">
            {t("article.allArticles")}
          </Link>
        )}
      </nav>
    </article>
  );
}
