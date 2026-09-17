/**
 * Consent for non-essential storage and scripts. Strictly necessary storage is
 * always on; analytics and advertising need an explicit yes. The choice lives in localStorage
 * (it also works inside the Sage snapshot and never reaches a server), expires after 12 months,
 * and a Do Not Track or Global Privacy Control signal counts as refusal of both.
 *
 * Nothing non-essential exists today. Anything added later must check `allowed(category)`
 * before loading.
 */
export type ConsentCategory = "analytics" | "advertising";

export const CONSENT_CATEGORIES: readonly ConsentCategory[] = ["analytics", "advertising"];

export const CONSENT_KEY = "mempool-xch:consent:v1";

export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export interface ConsentRecord {
  analytics: boolean;
  advertising: boolean;
  /** Epoch milliseconds of the decision. */
  decidedAt: number;
}

export interface ConsentState {
  /** Stored, unexpired decision; null until the visitor decides (or after it expired). */
  record: ConsentRecord | null;
  /** True when the browser sends Do Not Track or Global Privacy Control. */
  signal: boolean;
  /** Whether the banner should ask: no decision and no refusal signal. */
  undecided: boolean;
  analytics: boolean;
  advertising: boolean;
}

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

interface PrivacyNavigator {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

/** Do Not Track ("1" or "yes") or Global Privacy Control. */
export function hasRefusalSignal(nav: PrivacyNavigator | null | undefined, win?: { doNotTrack?: string | null }): boolean {
  if (!nav) return false;
  if (nav.globalPrivacyControl === true) return true;
  const dnt = nav.doNotTrack ?? win?.doNotTrack;
  return dnt === "1" || dnt === "yes";
}

export function parseConsent(raw: string | null, now: number): ConsentRecord | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof value.decidedAt !== "number" || !Number.isFinite(value.decidedAt)) return null;
    if (value.decidedAt > now || now - value.decidedAt >= CONSENT_TTL_MS) return null;
    return { analytics: value.analytics === true, advertising: value.advertising === true, decidedAt: value.decidedAt };
  } catch {
    return null;
  }
}

export function resolveConsent(record: ConsentRecord | null, signal: boolean): ConsentState {
  return {
    record,
    signal,
    undecided: record === null && !signal,
    analytics: !signal && record?.analytics === true,
    advertising: !signal && record?.advertising === true,
  };
}

type Listener = () => void;

export interface ConsentStore {
  get: () => ConsentState;
  save: (choice: Record<ConsentCategory, boolean>) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createConsentStore(storage: Storage | null, options: { signal: boolean; now?: () => number }): ConsentStore {
  const now = options.now ?? Date.now;
  let record: ConsentRecord | null = null;
  try {
    record = parseConsent(storage?.getItem(CONSENT_KEY) ?? null, now());
  } catch {
    record = null;
  }
  let state = resolveConsent(record, options.signal);
  const listeners = new Set<Listener>();
  return {
    get: () => {
      // Expire while the tab stays open, too.
      if (state.record && now() - state.record.decidedAt >= CONSENT_TTL_MS) state = resolveConsent(null, options.signal);
      return state;
    },
    save: (choice) => {
      const next: ConsentRecord = { analytics: choice.analytics === true, advertising: choice.advertising === true, decidedAt: now() };
      try {
        storage?.setItem(CONSENT_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable: the choice holds for this tab only.
      }
      state = resolveConsent(next, options.signal);
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let browserStore: ConsentStore | null = null;

/** Singleton bound to window.localStorage and the browser's privacy signals. */
export function getConsentStore(): ConsentStore {
  if (!browserStore) {
    const inBrowser = typeof window !== "undefined";
    let storage: Storage | null = null;
    try {
      storage = inBrowser ? window.localStorage : null;
    } catch {
      storage = null;
    }
    const signal = inBrowser && hasRefusalSignal(navigator as PrivacyNavigator, window as { doNotTrack?: string | null });
    browserStore = createConsentStore(storage, { signal });
  }
  return browserStore;
}
