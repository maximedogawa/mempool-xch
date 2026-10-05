import { devices, type Project } from "@playwright/test";

/**
 * Every e2e test runs once, where it matters (TASK-111): the desktop project runs everything
 * except @phone tests; the phone project runs only @phone (phone layout, touch targets, the
 * mobile menu) and @touch tests (behaviour a tap changes, checked on both). @live needs LIVE=1
 * and @local (machine-dependent budgets) never runs on CI. Shared by playwright.config.ts and
 * playwright.sage.config.ts.
 */
function excluded(tags: string[]): RegExp | undefined {
  const all = [
    ...tags,
    ...(process.env.LIVE ? [] : ["@live"]),
    ...(process.env.CI ? ["@local"] : []),
  ];
  return all.length ? new RegExp(all.join("|")) : undefined;
}

export function e2eProjects(prefix = ""): Project[] {
  return [
    {
      name: `${prefix}desktop`,
      use: { ...devices["Desktop Chrome"] },
      grepInvert: excluded(["@phone"]),
    },
    {
      name: `${prefix}mobile`,
      use: { ...devices["Pixel 7"] },
      grep: /@phone|@touch/,
      grepInvert: excluded([]),
    },
  ];
}
