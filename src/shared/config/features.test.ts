import { describe, expect, test } from "bun:test";
import { parseFlag } from "./features";

describe("parseFlag", () => {
  test("reads the usual on and off spellings", () => {
    for (const v of ["1", "true", "on", " TRUE "]) expect(parseFlag(v, false)).toBe(true);
    for (const v of ["0", "false", "off", "Off"]) expect(parseFlag(v, true)).toBe(false);
  });

  test("keeps the default when unset or unrecognised", () => {
    expect(parseFlag(undefined, true)).toBe(true);
    expect(parseFlag("", false)).toBe(false);
    expect(parseFlag("yes please", false)).toBe(false);
  });
});
