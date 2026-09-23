/**
 * A deliberately small message formatter: `{name}` placeholders, plural objects keyed by
 * Intl.PluralRules categories, and `<tag>…</tag>` markup rendered by caller-supplied functions.
 * Static-export friendly (no middleware, no server runtime), so the Sage build uses it as is.
 */
import { createElement, Fragment, type ReactNode } from "react";
import { INTL_TAGS, type Locale } from "./config";

/** A counted message. English needs `one` and `other`; other languages use their own categories. */
export interface Plural {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

export type MessageLeaf = string | Plural;

export interface MessageTree {
  [key: string]: MessageLeaf | MessageTree;
}

/**
 * The shape a translation must have: every English key, strings stay strings, plurals may use
 * whatever categories the language needs. A group must not have a key named `other`: an object
 * with `other` is a plural.
 */
export type Translation<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends { other: string }
      ? Plural
      : Translation<T[K]>;
};

/** Dot paths to every message in a namespace: "title", "groups.assets". */
export type MessageKey<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends { other: string }
      ? K
      : `${K}.${MessageKey<T[K]>}`;
}[keyof T & string];

export type MessageValue = string | number | bigint;
export type MessageValues = Record<string, MessageValue>;
export type RichTag = (chunks: ReactNode) => ReactNode;
export type RichValues = Record<string, MessageValue | RichTag>;

function lookup(tree: MessageTree | undefined, path: string): MessageLeaf | undefined {
  let node: MessageLeaf | MessageTree | undefined = tree;
  for (const part of path.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as MessageTree)[part];
  }
  if (typeof node === "string") return node;
  if (node && typeof node === "object" && typeof (node as Plural).other === "string") {
    return node as Plural;
  }
  return undefined;
}

const pluralRules = new Map<Locale, Intl.PluralRules>();
const numberFormats = new Map<Locale, Intl.NumberFormat>();

function pluralCategory(locale: Locale, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(INTL_TAGS[locale]);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
}

function formatValue(locale: Locale, value: MessageValue): string {
  if (typeof value === "string") return value;
  let format = numberFormats.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(INTL_TAGS[locale], { maximumFractionDigits: 20 });
    numberFormats.set(locale, format);
  }
  return format.format(value);
}

function pick(leaf: MessageLeaf, locale: Locale, values?: Record<string, unknown>): string {
  if (typeof leaf === "string") return leaf;
  const count = values?.count;
  const n = typeof count === "bigint" ? Number(count) : typeof count === "number" ? count : NaN;
  if (Number.isNaN(n)) return leaf.other;
  if (n === 0 && leaf.zero !== undefined) return leaf.zero;
  return leaf[pluralCategory(locale, n)] ?? leaf.other;
}

function interpolate(template: string, locale: Locale, values?: Record<string, unknown>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    return typeof value === "string" || typeof value === "number" || typeof value === "bigint"
      ? formatValue(locale, value)
      : match;
  });
}

const TAG = /<(\w+)>([\s\S]*?)<\/\1>/;

function renderRich(text: string, tags: Record<string, unknown>, key = "r"): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let i = 0;
  for (let match = TAG.exec(rest); match; match = TAG.exec(rest)) {
    if (match.index > 0) out.push(rest.slice(0, match.index));
    const [whole, name, inner] = match;
    const render = tags[name!];
    const children = renderRich(inner!, tags, `${key}.${i}`);
    out.push(
      createElement(
        Fragment,
        { key: `${key}.${i}` },
        typeof render === "function" ? (render as RichTag)(children) : children
      )
    );
    rest = rest.slice(match.index + whole.length);
    i += 1;
  }
  if (rest) out.push(rest);
  return out;
}

export interface Translator<Key extends string = string> {
  (key: Key, values?: MessageValues): string;
  /** Same as calling it, with `<tag>…</tag>` markup rendered by the functions in `values`. */
  rich: (key: Key, values?: RichValues) => ReactNode;
  has: (key: string) => boolean;
}

/**
 * Translator for one namespace. A key missing in `messages` falls back to English, then to the
 * key itself, so a gap shows up as readable text rather than a crash.
 */
export function createTranslator<Key extends string = string>(
  locale: Locale,
  messages: MessageTree | undefined,
  fallback: MessageTree | undefined
): Translator<Key> {
  const resolve = (key: string) => lookup(messages, key) ?? lookup(fallback, key);
  const t = ((key: string, values?: MessageValues) => {
    const leaf = resolve(key);
    return leaf === undefined ? key : interpolate(pick(leaf, locale, values), locale, values);
  }) as unknown as Translator<Key>;
  t.rich = (key, values) => {
    const leaf = resolve(key);
    if (leaf === undefined) return key;
    const text = interpolate(pick(leaf, locale, values), locale, values);
    return createElement(Fragment, null, ...renderRich(text, values ?? {}));
  };
  t.has = (key) => resolve(key) !== undefined;
  return t;
}
