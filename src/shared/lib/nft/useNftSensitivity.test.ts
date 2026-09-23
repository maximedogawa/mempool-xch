import { describe, expect, test } from "bun:test";
import blockedNft from "@/test-utils/fixtures/mintgardenBlockedNft.json";
import { UNCLASSIFIED } from "./sensitivity";
import { recordSensitivity } from "./useNftSensitivity";

describe("recordSensitivity", () => {
  test("a recorded blocked record is blocked", () => {
    expect(recordSensitivity(blockedNft).level).toBe("blocked");
  });

  test("a clean record is clear", () => {
    expect(recordSensitivity({ is_blocked: false, data: {}, collection: {} })).toEqual({
      level: "clear",
      reason: null,
    });
  });

  test("no record (not indexed, or the request failed) is veiled, never taken on trust", () => {
    expect(recordSensitivity(null)).toEqual(UNCLASSIFIED);
    expect(recordSensitivity(undefined)).toEqual(UNCLASSIFIED);
  });
});
