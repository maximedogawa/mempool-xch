import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/shared/config/legal";
import { routes } from "@/shared/lib/routes";

const PAGES = [
  { href: routes.legalTerms(), label: "Terms of use" },
  { href: routes.legalNotice(), label: "Legal notice" },
  { href: routes.legalPrivacy(), label: "Privacy policy" },
  { href: routes.legalCookies(), label: "Cookie policy" },
];

export function LegalPage({ title, current, intro, children }: { title: string; current: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <nav aria-label="Legal pages" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            aria-current={page.href === current ? "page" : undefined}
            className={page.href === current ? "font-semibold text-fg" : "text-fg-muted hover:text-fg"}
          >
            {page.label}
          </Link>
        ))}
      </nav>
      <header>
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-1 text-xs text-fg-faint">Last updated {LEGAL_UPDATED}</p>
        {intro ? <div className="mt-3 text-sm text-fg-muted">{intro}</div> : null}
      </header>
      <div className="flex flex-col gap-6 text-sm leading-relaxed text-fg-muted">{children}</div>
    </article>
  );
}

export function Section({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
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
