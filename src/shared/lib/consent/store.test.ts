import { describe, expect, test } from "bun:test";
import {
  CONSENT_KEY,
  CONSENT_TTL_MS,
  createConsentStore,
  hasRefusalSignal,
  parseConsent,
  resolveConsent,
} from "./store";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const T0 = Date.UTC(2026, 8, 17);

describe("consent store", () => {
  test("undecided until saved, then persisted and notified", () => {
    const storage = memoryStorage();
    const store = createConsentStore(storage, { signal: false, now: () => T0 });
    expect(store.get()).toMatchObject({
      record: null,
      undecided: true,
      analytics: false,
      advertising: false,
    });
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    store.save({ analytics: true, advertising: false });
    expect(notified).toBe(1);
    expect(store.get()).toMatchObject({ undecided: false, analytics: true, advertising: false });
    expect(JSON.parse(storage.data.get(CONSENT_KEY)!)).toEqual({
      analytics: true,
      advertising: false,
      decidedAt: T0,
    });
    const reloaded = createConsentStore(storage, { signal: false, now: () => T0 + 1000 });
    expect(reloaded.get()).toMatchObject({ undecided: false, analytics: true });
  });

  test("a decision expires after 12 months, also while the tab stays open", () => {
    const record = JSON.stringify({ analytics: true, advertising: true, decidedAt: T0 });
    expect(parseConsent(record, T0 + CONSENT_TTL_MS - 1)).not.toBeNull();
    expect(parseConsent(record, T0 + CONSENT_TTL_MS)).toBeNull();
    let clock = T0;
    const store = createConsentStore(memoryStorage({ [CONSENT_KEY]: record }), {
      signal: false,
      now: () => clock,
    });
    expect(store.get().analytics).toBe(true);
    clock = T0 + CONSENT_TTL_MS;
    expect(store.get()).toMatchObject({ undecided: true, analytics: false, advertising: false });
  });

  test("rejects malformed or future-dated records", () => {
    expect(parseConsent("not json", T0)).toBeNull();
    expect(parseConsent(JSON.stringify({ analytics: true }), T0)).toBeNull();
    expect(
      parseConsent(JSON.stringify({ analytics: true, decidedAt: T0 + 60_000 }), T0)
    ).toBeNull();
    expect(
      parseConsent(JSON.stringify({ analytics: "yes", advertising: 1, decidedAt: T0 }), T0)
    ).toEqual({ analytics: false, advertising: false, decidedAt: T0 });
  });

  test("Do Not Track and Global Privacy Control count as refusal and suppress the banner", () => {
    expect(hasRefusalSignal({ globalPrivacyControl: true })).toBe(true);
    expect(hasRefusalSignal({ doNotTrack: "1" })).toBe(true);
    expect(hasRefusalSignal({ doNotTrack: null }, { doNotTrack: "1" })).toBe(true);
    expect(hasRefusalSignal({ doNotTrack: "0", globalPrivacyControl: false })).toBe(false);
    expect(hasRefusalSignal(undefined)).toBe(false);
    const accepted = { analytics: true, advertising: true, decidedAt: T0 };
    expect(resolveConsent(null, true)).toMatchObject({
      undecided: false,
      analytics: false,
      advertising: false,
    });
    expect(resolveConsent(accepted, true)).toMatchObject({ analytics: false, advertising: false });
  });

  test("keeps working without storage", () => {
    const throwing = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {},
    };
    const store = createConsentStore(throwing, { signal: false, now: () => T0 });
    expect(store.get().undecided).toBe(true);
    store.save({ analytics: false, advertising: false });
    expect(store.get().undecided).toBe(false);
  });
});
