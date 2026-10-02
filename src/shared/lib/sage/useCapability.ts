"use client";

import { useCallback, useSyncExternalStore } from "react";
import { capabilities } from "./bridge";

/** Granted / refused state of one Sage capability, live, plus an enable() that asks once more. */
export function useSageCapability(capability: string): {
  granted: boolean;
  refused: boolean;
  enable: () => Promise<boolean>;
} {
  const snapshot = useSyncExternalStore(
    (cb) => capabilities.subscribe(cb),
    () => `${capabilities.has(capability) ? 1 : 0}${capabilities.isRefused(capability) ? 1 : 0}`,
    () => "00"
  );
  const enable = useCallback(() => capabilities.ensure(capability, true), [capability]);
  return { granted: snapshot[0] === "1", refused: snapshot[1] === "1", enable };
}
