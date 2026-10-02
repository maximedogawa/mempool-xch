"use client";

import Link from "next/link";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LEARN_ARTICLES, learnHref } from "./articles";
import learnNs from "@/shared/i18n/messages/en/learn";

export function LearnIndex() {
  const t = useT(learnNs);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("index.title")}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t("index.intro")}</p>
      </header>
      <ol className="flex flex-col gap-3">
        {LEARN_ARTICLES.map((a, i) => (
          <li key={a.slug}>
            <Link
              href={learnHref(a.slug)}
              className="card-lift flex items-start gap-4 rounded-card border border-border bg-surface px-4 py-3 hover:border-border-strong"
            >
              <span className="tabular mt-0.5 text-lg font-semibold text-fg-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-semibold text-fg">{t(`${a.key}.title`)}</span>
                <span className="text-sm text-fg-muted">{t(`${a.key}.summary`)}</span>
                <span className="text-xs text-fg-faint">
                  {t("article.minRead", { minutes: a.minutes })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-sm text-fg-muted">
        {t.rich("index.alsoWorth", {
          prefarm: (c) => (
            <Link href={routes.prefarm()} className="text-accent hover:underline">
              {c}
            </Link>
          ),
          docs: (c) => (
            <Link href={routes.docs()} className="text-accent hover:underline">
              {c}
            </Link>
          ),
          status: (c) => (
            <Link href={routes.status()} className="text-accent hover:underline">
              {c}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
