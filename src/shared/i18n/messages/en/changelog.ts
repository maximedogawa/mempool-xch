/** Changelog page chrome (src/widgets/changelog); the release entries stay English. */
const messages = {
  title: "Changelog",
  intro:
    "Every release of mempoolxch.space, generated from the repository's tags and commit messages. The published release notes live on <releases>GitHub</releases>, and the full commit history is <commits>there too</commits>.",
  unreleased: "Unreleased",
  untagged: "on the branch, not tagged yet",
  running: "running",
  compareOnGitHub: "compare on GitHub",
  releaseNotes: "release notes",
  compare: "compare",
  footer: "Generated {date}. Regenerate with <code>bun run changelog</code> after tagging.",
};

export default messages;
