import { describe, expect, test } from "bun:test";
import {
  isDexiePlaceholder,
  MISSING_ICON_TTL_MS,
  MISSING_ICONS_KEY,
  MISSING_ICONS_MAX,
  readMissingIcons,
  writeMissingIcons,
} from "./missingIcons";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

const A = "https://icons.dexie.space/aa.webp";
const B = "https://icons.dexie.space/bb.webp";

describe("Dexie placeholder", () => {
  test("only Dexie's 500×500 answer counts as missing", () => {
    expect(isDexiePlaceholder("https://icons.dexie.space/aa.webp", 500, 500)).toBe(true);
    expect(isDexiePlaceholder("https://icons.dexie.space/aa.webp", 512, 512)).toBe(false);
    expect(isDexiePlaceholder("https://example.com/aa.png", 500, 500)).toBe(false);
  });
});

describe("missing icons", () => {
  test("keeps entries younger than a day and drops older ones", () => {
    const now = 10 * MISSING_ICON_TTL_MS;
    const storage = memoryStorage({
      [MISSING_ICONS_KEY]: JSON.stringify({ [A]: now - 1000, [B]: now - MISSING_ICON_TTL_MS }),
    });
    expect(readMissingIcons(storage, now)).toEqual({ [A]: now - 1000 });
  });

  test("ignores garbage in storage", () => {
    expect(readMissingIcons(memoryStorage({ [MISSING_ICONS_KEY]: "not json" }))).toEqual({});
    expect(readMissingIcons(memoryStorage({ [MISSING_ICONS_KEY]: "[1,2]" }))).toEqual({});
    expect(
      readMissingIcons(memoryStorage({ [MISSING_ICONS_KEY]: JSON.stringify({ [A]: "x" }) }))
    ).toEqual({});
    expect(readMissingIcons(null)).toEqual({});
  });

  test("stores at most the newest MISSING_ICONS_MAX entries", () => {
    const storage = memoryStorage();
    const entries: Record<string, number> = {};
    for (let i = 0; i < MISSING_ICONS_MAX + 5; i++) entries[`https://x/${i}.webp`] = i;
    writeMissingIcons(storage, entries);
    const stored = JSON.parse(storage.data[MISSING_ICONS_KEY]!) as Record<string, number>;
    expect(Object.keys(stored)).toHaveLength(MISSING_ICONS_MAX);
    expect(stored["https://x/0.webp"]).toBeUndefined();
    expect(stored[`https://x/${MISSING_ICONS_MAX + 4}.webp`]).toBe(MISSING_ICONS_MAX + 4);
  });

  test("a storage that throws does not break writing", () => {
    expect(() =>
      writeMissingIcons(
        {
          setItem: () => {
            throw new Error("quota");
          },
        },
        { [A]: 1 }
      )
    ).not.toThrow();
  });
});
