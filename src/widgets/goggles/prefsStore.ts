/**
 * The goggles' filters and view choices, kept in localStorage so they survive a reload. Listed
 * in the cookie policy (src/widgets/legal/CookiesContent.tsx). Storage may be missing or throw
 * (private mode, Sage webview restrictions): the widget then simply starts from the defaults.
 */
import { DEFAULT_PREFS, parsePrefs, type GogglesPrefs } from "./model";

export const GOGGLES_PREFS_KEY = "mempool-xch:goggles:v1";

export function loadPrefs(storage: Pick<Storage, "getItem"> | null): GogglesPrefs {
  try {
    const raw = storage?.getItem(GOGGLES_PREFS_KEY);
    return raw ? parsePrefs(JSON.parse(raw)) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(
  storage: Pick<Storage, "setItem" | "removeItem"> | null,
  prefs: GogglesPrefs
): void {
  try {
    if (JSON.stringify(prefs) === JSON.stringify(DEFAULT_PREFS))
      storage?.removeItem(GOGGLES_PREFS_KEY);
    else storage?.setItem(GOGGLES_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Quota or a locked-down webview: the choice lasts for this page view only.
  }
}
