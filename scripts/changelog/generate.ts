/**
 * Builds src/shared/config/changelog.json from git tags: one entry per version tag with its
 * date and the commit subjects since the previous tag (merge commits dropped), plus an
 * "unreleased" entry for what sits above the latest tag. Committed so the Docker build, which
 * has no git history, still ships a changelog; run after tagging a release:
 *
 *   bun run changelog
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

interface Release {
  version: string;
  date: string | null;
  changes: string[];
}

const git = (args: string) => execSync(`git ${args}`, { encoding: "utf8" }).trim();

function subjects(range: string): string[] {
  const out = git(`log --no-merges --format=%s ${range}`);
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s && !/^(wip|fixup!|squash!)/i.test(s));
}

function main() {
  const tags = git("tag -l --sort=-v:refname")
    .split("\n")
    .map((t) => t.trim())
    .filter((t) => /^\d+\.\d+\.\d+$/.test(t));
  const releases: Release[] = [];
  const unreleased = tags[0] ? subjects(`${tags[0]}..HEAD`) : subjects("HEAD");
  if (unreleased.length > 0)
    releases.push({ version: "unreleased", date: null, changes: unreleased });
  tags.forEach((tag, i) => {
    const prev = tags[i + 1];
    const date = git(`log -1 --format=%cs ${tag}`);
    releases.push({ version: tag, date, changes: subjects(prev ? `${prev}..${tag}` : tag) });
  });
  const target = join(import.meta.dir, "../../src/shared/config/changelog.json");
  writeFileSync(
    target,
    `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), releases }, null, 2)}\n`
  );
  console.log(`wrote ${target}: ${releases.length} entries`);
}

main();
