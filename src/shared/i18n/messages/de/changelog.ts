import type { Translation } from "../../translate";
import type en from "../en/changelog";

const messages: Translation<typeof en> = {
  title: "Changelog",
  intro:
    "Alle Releases von mempoolxch.space, erzeugt aus den Tags und Commit-Nachrichten des Repositorys. Die veröffentlichten Release Notes finden Sie auf <releases>GitHub</releases>, die vollständige Commit-Historie <commits>ebenfalls dort</commits>.",
  unreleased: "Unveröffentlicht",
  untagged: "auf dem Branch, noch nicht getaggt",
  running: "läuft",
  compareOnGitHub: "auf GitHub vergleichen",
  releaseNotes: "Release Notes",
  compare: "vergleichen",
  footer: "Erzeugt am {date}. Nach dem Taggen mit <code>bun run changelog</code> neu erzeugen.",
};

export default messages;
