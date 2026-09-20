import { expect, test } from "bun:test";
import changelog from "@/shared/config/changelog.json";
import { previousOf } from "./ChangelogPage";

const tagged = (changelog.releases as { version: string }[])
  .map((r) => r.version)
  .filter((v) => v !== "unreleased");

test("previousOf pairs each release with the one before it for a compare link", () => {
  expect(previousOf(["0.7.0", "0.6.0", "0.5.1"], "0.7.0")).toBe("0.6.0");
  expect(previousOf(["0.7.0", "0.6.0", "0.5.1"], "0.6.0")).toBe("0.5.1");
  // The oldest release has nothing to compare against, and an unknown tag is not guessed.
  expect(previousOf(["0.7.0", "0.6.0", "0.5.1"], "0.5.1")).toBeNull();
  expect(previousOf(["0.7.0"], "9.9.9")).toBeNull();
  expect(previousOf([], "0.7.0")).toBeNull();
});

test("the committed changelog is newest-first, so the compare pairs are right", () => {
  expect(tagged.length).toBeGreaterThan(1);
  const descending = [...tagged].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  expect(tagged).toEqual(descending);
});

test("every tagged release has a date and at least one change", () => {
  for (const release of changelog.releases as {
    version: string;
    date: string | null;
    changes: string[];
  }[]) {
    if (release.version === "unreleased") continue;
    expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(release.changes.length).toBeGreaterThan(0);
  }
});
