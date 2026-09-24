"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/shared/config/legal";
import { intlTag } from "@/shared/i18n/active";
import { useLocale, useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";

const PAGES = [
  { href: routes.legalTerms(), label: "terms" },
  { href: routes.legalNotice(), label: "notice" },
  { href: routes.legalPrivacy(), label: "privacy" },
  { href: routes.legalCookies(), label: "cookies" },
] as const;

/** LEGAL_UPDATED ("YYYY-MM-DD") as a long date in the active language, read as a calendar day. */
function formatUpdated(locale: ReturnType<typeof useLocale>): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(LEGAL_UPDATED);
  if (!match) return LEGAL_UPDATED;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(intlTag(locale), { dateStyle: "long", timeZone: "UTC" }).format(
    date
  );
}

export function LegalPage({
  title,
  current,
  intro,
  children,
}: {
  title: string;
  current: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const t = useT("legal");
  const locale = useLocale();
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav aria-label={t("page.navLabel")} className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            aria-current={page.href === current ? "page" : undefined}
            className={
              page.href === current ? "font-semibold text-fg" : "text-fg-muted hover:text-fg"
            }
          >
            {t(`page.nav.${page.label}`)}
          </Link>
        ))}
      </nav>
      <header>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-xs text-fg-faint">
          {t("page.lastUpdated", { date: formatUpdated(locale) })}
        </p>
        {locale !== "en" ? (
          <p className="mt-1 text-xs text-fg-faint">{t("page.translationNote")}</p>
        ) : null}
        {intro ? <div className="mt-3 text-sm text-fg-muted">{intro}</div> : null}
      </header>
      <div className="flex flex-col gap-6 text-sm leading-relaxed text-fg-muted">{children}</div>
    </article>
  );
}

export function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}

/** Inline link style shared by the legal texts. */
export const linkClass = "text-accent underline underline-offset-2";
