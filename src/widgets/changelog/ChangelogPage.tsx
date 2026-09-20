import changelog from "@/shared/config/changelog.json";
import { ExternalLink } from "@/shared/ui/ExternalLink";

const REPO = "https://github.com/maximedogawa/mempool-xch";

interface Release {
  version: string;
  date: string | null;
  changes: string[];
}

/** The tag released before `version`, for a GitHub compare link; null for the first release. */
export function previousOf(tagged: string[], version: string): string | null {
  const at = tagged.indexOf(version);
  return at >= 0 ? (tagged[at + 1] ?? null) : null;
}

/**
 * Releases from git tags (scripts/changelog/generate.ts); the newest entry may be unreleased
 * work on the branch. The subjects here are this repository's own commits; each entry also links
 * out to the release GitHub publishes for that tag, which carries the contributors and the pull
 * requests that a commit subject alone leaves out. Links only: the page ships inside the Docker
 * image and the offline Sage export, so it never calls the GitHub API.
 */
export function ChangelogPage() {
  const releases = changelog.releases as Release[];
  const current = process.env.NEXT_PUBLIC_APP_VERSION ?? "";
  const tagged = releases.filter((r) => r.version !== "unreleased").map((r) => r.version);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Changelog</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Every release of mempoolxch.space, generated from the repository&apos;s tags and commit
          messages. The published release notes live on{" "}
          <ExternalLink href={`${REPO}/releases`} className="text-accent hover:underline">
            GitHub
          </ExternalLink>
          , and the full commit history is{" "}
          <ExternalLink href={`${REPO}/commits`} className="text-accent hover:underline">
            there too
          </ExternalLink>
          .
        </p>
      </header>
      <ol className="flex flex-col gap-6">
        {releases.map((r) => (
          <li key={r.version} className="flex flex-col gap-2" data-testid={`release-${r.version}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-base font-semibold text-fg">
                {r.version === "unreleased" ? "Unreleased" : `v${r.version}`}
              </h2>
              {r.date ? (
                <span className="text-xs text-fg-faint">{r.date}</span>
              ) : (
                <span className="text-xs text-fg-faint">on the branch, not tagged yet</span>
              )}
              {r.version === current ? (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  running
                </span>
              ) : null}
              {r.version === "unreleased" ? (
                tagged[0] ? (
                  <ExternalLink
                    href={`${REPO}/compare/${tagged[0]}...main`}
                    className="text-xs text-accent hover:underline"
                  >
                    compare on GitHub
                  </ExternalLink>
                ) : null
              ) : (
                <>
                  <ExternalLink
                    href={`${REPO}/releases/tag/${r.version}`}
                    className="text-xs text-accent hover:underline"
                  >
                    release notes
                  </ExternalLink>
                  {previousOf(tagged, r.version) ? (
                    <ExternalLink
                      href={`${REPO}/compare/${previousOf(tagged, r.version)}...${r.version}`}
                      className="text-xs text-fg-faint hover:text-accent hover:underline"
                    >
                      compare
                    </ExternalLink>
                  ) : null}
                </>
              )}
            </div>
            <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
              {r.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-faint">
        Generated {changelog.generatedAt}. Regenerate with{" "}
        <span className="mono">bun run changelog</span> after tagging.
      </p>
    </div>
  );
}
