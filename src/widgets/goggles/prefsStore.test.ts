import { describe, expect, test } from "bun:test";
import { DEFAULT_PREFS, EMPTY_FILTERS } from "./model";
import { GOGGLES_PREFS_KEY, loadPrefs, savePrefs } from "./prefsStore";

function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("goggles preferences store", () => {
  test("saves and loads", () => {
    const storage = memory();
    const prefs = {
      ...DEFAULT_PREFS,
      filters: { ...EMPTY_FILTERS, kinds: ["nft" as const] },
      nonMatching: "hide" as const,
    };
    savePrefs(storage, prefs);
    expect(storage.data.has(GOGGLES_PREFS_KEY)).toBe(true);
    expect(loadPrefs(storage)).toEqual(prefs);
  });
  test("the defaults leave nothing behind", () => {
    const storage = memory();
    storage.data.set(GOGGLES_PREFS_KEY, "{}");
    savePrefs(storage, DEFAULT_PREFS);
    expect(storage.data.size).toBe(0);
  });
  test("missing, broken or throwing storage gives the defaults", () => {
    expect(loadPrefs(null)).toEqual(DEFAULT_PREFS);
    const storage = memory();
    storage.data.set(GOGGLES_PREFS_KEY, "{not json");
    expect(loadPrefs(storage)).toEqual(DEFAULT_PREFS);
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    expect(loadPrefs(throwing)).toEqual(DEFAULT_PREFS);
    expect(() => savePrefs(throwing, DEFAULT_PREFS)).not.toThrow();
  });
});
