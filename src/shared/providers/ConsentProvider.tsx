"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getConsentStore,
  resolveConsent,
  type ConsentCategory,
  type ConsentState,
} from "@/shared/lib/consent/store";

export interface ConsentContextValue extends ConsentState {
  save: (choice: Record<ConsentCategory, boolean>) => void;
  /** True while the consent panel is showing (first visit or opened from the footer). */
  panelOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

// SSR and the hydration render: nothing is allowed and the banner stays hidden until the
// browser store has been read, so there is no flash for visitors who already decided.
const SERVER_STATE: ConsentState = { ...resolveConsent(null, false), undecided: false };
const serverSnapshot = () => SERVER_STATE;

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const store = getConsentStore();
  const state = useSyncExternalStore(store.subscribe, store.get, serverSnapshot);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const save = useCallback(
    (choice: Record<ConsentCategory, boolean>) => {
      store.save(choice);
      setSettingsOpen(false);
    },
    [store]
  );
  const value = useMemo<ConsentContextValue>(
    () => ({
      ...state,
      save,
      panelOpen: settingsOpen || state.undecided,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [state, save, settingsOpen]
  );
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside ConsentProvider");
  return ctx;
}
