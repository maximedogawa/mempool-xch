import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { LEARN_ARTICLES, learnHref } from "./articles";

export function LearnIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Learn</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Short explanations of the things this explorer shows, written for people who use Chia
          rather than build it. Each article links to the page where you can watch the concept live.
        </p>
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
                <span className="font-semibold text-fg">{a.title}</span>
                <span className="text-sm text-fg-muted">{a.summary}</span>
                <span className="text-xs text-fg-faint">{a.minutes} min read</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-sm text-fg-muted">
        Also worth a look: the{" "}
        <Link href={routes.prefarm()} className="text-accent hover:underline">
          prefarm tracker
        </Link>
        , the{" "}
        <Link href={routes.docs()} className="text-accent hover:underline">
          help page
        </Link>{" "}
        about this site, and the{" "}
        <Link href={routes.status()} className="text-accent hover:underline">
          status page
        </Link>{" "}
        for the services it depends on.
      </p>
    </div>
  );
}
