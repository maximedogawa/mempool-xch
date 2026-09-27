/**
 * Theme registry. To add a theme: copy ./themes/light.ts (or dark.ts) to ./themes/<id>.ts, list
 * it in THEMES below, add `appearance.<id>` and `appearance.<id>Hint` to the settings messages,
 * then run `bun run themes` to regenerate the CSS. Nothing else refers to a theme by name: the
 * settings picker, the "system" choice, Sage's host theme, <meta name="theme-color"> and the
 * embeds all read this list.
 */
import type { ColorScheme, ThemeDefinition } from "./define";
import { dark } from "./themes/dark";
import { light } from "./themes/light";
import { midnight } from "./themes/midnight";

export type { ColorScheme, ThemeDefinition } from "./define";

export const THEMES = [light, dark, midnight] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type ThemePreference = ThemeId | "system";

/** The theme a first visit and server render get. */
export const DEFAULT_THEME: ThemeId = "light";

/** What "system" and Sage's light/dark host theme map to. */
export const SCHEME_THEMES: Record<ColorScheme, ThemeId> = { light: "light", dark: "dark" };

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function themeById(id: ThemeId): ThemeDefinition<ThemeId> {
  return THEMES.find((theme) => theme.id === id)!;
}

/** The concrete theme for a stored preference, given whether the device prefers dark. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ThemeId {
  if (preference === "system") return SCHEME_THEMES[prefersDark ? "dark" : "light"];
  return preference;
}
