import type { BaseToken, ThemeToken } from "./tokens";

export type ColorScheme = "light" | "dark";

export interface ThemeDefinition<
  Id extends string = string,
  Palette extends Record<string, string> = Record<string, string>,
> {
  /** Stored in settings and set as `<html data-theme>`; lowercase letters, digits and dashes. */
  id: Id;
  /** Native controls, scrollbars and "system" matching follow this. */
  scheme: ColorScheme;
  /** Raw colours, emitted as `--name`; tokens reference them with `var(--name)`. */
  palette: Palette;
  /** The full contract (./tokens.ts): a missing token is a type error. */
  tokens: Record<ThemeToken, string> & Partial<Record<BaseToken, string>>;
}

/**
 * Identity helper that keeps the literal id and palette keys (so `light.palette.ink` is typed)
 * and checks the definition against the contract.
 */
export function defineTheme<const Id extends string, const Palette extends Record<string, string>>(
  theme: ThemeDefinition<Id, Palette>
): ThemeDefinition<Id, Palette> {
  return theme;
}
