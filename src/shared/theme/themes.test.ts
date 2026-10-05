import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import settingsNs from "@/shared/i18n/messages/en/settings";
import { renderThemesCss } from "./css";
import { DEFAULT_THEME, SCHEME_THEMES, THEMES, themeById } from "./index";
import { BASE_TOKENS, THEME_TOKENS } from "./tokens";

const GENERATED = ["src/shared/theme/themes.generated.css", "public/embed/themes.css"];

type Theme = (typeof THEMES)[number];

function lookup(theme: Theme): Record<string, string> {
  return { ...BASE_TOKENS, ...theme.palette, ...theme.tokens };
}

/** Splits "a, b(c, d), e" at top-level commas. */
function args(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth--;
    else if (text[i] === "," && depth === 0) {
      out.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(text.slice(start).trim());
  return out;
}

type Rgb = [number, number, number];

/** Resolves a token to an opaque sRGB colour: hex, var(), and color-mix(in srgb, …) of those. */
function resolve(value: string, vars: Record<string, string>): Rgb | null {
  const v = value.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(v);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16)) as Rgb;
  const ref = /^var\(--([a-z0-9-]+)\)$/.exec(v);
  if (ref) return vars[ref[1]!] ? resolve(vars[ref[1]!]!, vars) : null;
  const mix = /^color-mix\(in srgb,(.*)\)$/s.exec(v);
  if (mix) {
    const [a, b] = args(mix[1]!).map((part) => {
      const m = /^(.*?)(?:\s+(\d+(?:\.\d+)?)%)?$/s.exec(part)!;
      return { colour: m[1]!.trim(), pct: m[2] === undefined ? undefined : Number(m[2]) / 100 };
    });
    if (!a || !b) return null;
    const pa = a.pct ?? (b.pct === undefined ? 0.5 : 1 - b.pct);
    const ca = resolve(a.colour, vars);
    const cb = b.colour === "black" ? ([0, 0, 0] as Rgb) : resolve(b.colour, vars);
    if (!ca || !cb) return null;
    return ca.map((c, i) => c * pa + cb[i]! * (1 - pa)) as Rgb;
  }
  return null;
}

function contrast(a: Rgb, b: Rgb): number {
  const lum = ([r, g, bl]: Rgb) => {
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("themes", () => {
  test("the generated CSS is up to date (run `bun run themes`)", () => {
    const css = renderThemesCss(THEMES);
    for (const path of GENERATED) expect(readFileSync(path, "utf8")).toBe(css);
  });

  test("ids are unique and safe as attribute values", () => {
    const ids = THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  test("the default and the light/dark mapping point at themes of that scheme", () => {
    expect(themeById(DEFAULT_THEME)).toBeDefined();
    expect(themeById(SCHEME_THEMES.light).scheme).toBe("light");
    expect(themeById(SCHEME_THEMES.dark).scheme).toBe("dark");
  });

  for (const theme of THEMES) {
    describe(theme.id, () => {
      test("defines every token of the contract", () => {
        for (const token of THEME_TOKENS) expect(theme.tokens[token]).toBeTruthy();
      });

      test("every var() it uses is defined in the theme itself", () => {
        const vars = lookup(theme);
        for (const value of Object.values(vars)) {
          for (const [, name] of value.matchAll(/var\(--([a-z0-9-]+)\)/g)) {
            expect(vars, `var(--${name}) in ${theme.id}`).toHaveProperty(name!);
          }
        }
      });

      test("has a label and hint in the settings messages", () => {
        const appearance = settingsNs.messages.appearance as Record<string, string>;
        expect(appearance[theme.id]).toBeTruthy();
        expect(appearance[`${theme.id}Hint`]).toBeTruthy();
      });

      test("text keeps WCAG AA on its surfaces", () => {
        const vars = lookup(theme);
        const colour = (token: string) => {
          const rgb = resolve(vars[token]!, vars);
          if (!rgb) throw new Error(`${theme.id}: cannot resolve --${token}`);
          return rgb;
        };
        const surfaces = ["bg", "bg-elevated", "surface", "surface-2"];
        const text = ["fg", "fg-muted", "fg-faint", "primary", "accent", "warning", "danger"];
        for (const fg of text) {
          for (const bg of surfaces) {
            expect(
              contrast(colour(fg), colour(bg)),
              `${theme.id}: --${fg} on --${bg}`
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
        // Links and active chips sit on their own tint (--primary-soft over a surface).
        for (const bg of ["surface", "surface-2"]) {
          const tint = resolve(vars["primary-soft"]!.replace("transparent", vars[bg]!), vars);
          if (!tint) throw new Error(`${theme.id}: cannot resolve --primary-soft`);
          for (const fg of ["primary", "accent"]) {
            expect(
              contrast(colour(fg), tint),
              `${theme.id}: --${fg} on --primary-soft over --${bg}`
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
        expect(
          contrast(colour("cta-fg"), colour("cta")),
          `${theme.id}: CTA`
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          contrast(colour("primary-fg"), colour("primary")),
          `${theme.id}: primary fill`
        ).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  test("components read tokens, never a theme's own palette names", () => {
    const tokens = new Set<string>([...THEME_TOKENS, ...Object.keys(BASE_TOKENS)]);
    const paletteOnly = new Set(
      THEMES.flatMap((theme) => Object.keys(theme.palette)).filter((name) => !tokens.has(name))
    );
    const sources = [...files("src"), ...files("public/embed")].filter(
      (path) =>
        /\.(tsx?|css|js)$/.test(path) &&
        !path.startsWith(join("src", "shared", "theme")) &&
        !path.endsWith("themes.css")
    );
    const offenders: string[] = [];
    for (const path of sources) {
      for (const [, name] of readFileSync(path, "utf8").matchAll(/var\(--([a-z0-9-]+)\)/g)) {
        if (paletteOnly.has(name!)) offenders.push(`${path}: --${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
