/**
 * Dismissible top-of-page disclaimer banner. Separate from cookie consent: dismissing it only
 * records that the visitor has seen the disclaimer, and never touches analytics or advertising.
 * The choice lives in localStorage only (works inside the Sage snapshot, never reaches a server).
 */
export const DISCLAIMER_KEY = "mempool-xch:disclaimer-dismissed:v1";

export interface DisclaimerState {
  dismissed: boolean;
}

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

type Listener = () => void;

export interface DisclaimerStore {
  get: () => DisclaimerState;
  dismiss: () => void;
  subscribe: (listener: Listener) => () => void;
}

const NOT_DISMISSED: DisclaimerState = { dismissed: false };
const DISMISSED: DisclaimerState = { dismissed: true };

export function createDisclaimerStore(storage: Storage | null): DisclaimerStore {
  let dismissed = false;
  try {
    dismissed = storage?.getItem(DISCLAIMER_KEY) === "1";
  } catch {
    dismissed = false;
  }
  // Snapshot must be referentially stable between calls when nothing changed, or
  // useSyncExternalStore treats every render as a new value and loops.
  let state = dismissed ? DISMISSED : NOT_DISMISSED;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    dismiss: () => {
      if (dismissed) return;
      dismissed = true;
      state = DISMISSED;
      try {
        storage?.setItem(DISCLAIMER_KEY, "1");
      } catch {
        // Storage unavailable: the choice holds for this tab only.
      }
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let browserStore: DisclaimerStore | null = null;

/** Singleton bound to window.localStorage. */
export function getDisclaimerStore(): DisclaimerStore {
  if (!browserStore) {
    let storage: Storage | null = null;
    try {
      storage = typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      storage = null;
    }
    browserStore = createDisclaimerStore(storage);
  }
  return browserStore;
}
