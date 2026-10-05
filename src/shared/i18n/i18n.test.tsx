import { describe, expect, test } from "bun:test";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { detectLocale, LOCALES, resolveLocale } from "./config";
import { setActiveLocale } from "./active";
import en from "./messages/en";
import de from "./messages/de";
import es from "./messages/es";
import zh from "./messages/zh";
import { createTranslator, type MessageTree, type Plural } from "./translate";
import { formatAge, formatEta } from "@/shared/lib/format/time";
import { formatAmount, formatFeeRate, formatXch } from "@/shared/lib/chia/amounts";

function text(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement(node)) {
    const el = node as ReactElement<{ children?: ReactNode; href?: string }>;
    const inner = text(el.props.children);
    return typeof el.type === "string" ? `[${el.type}:${inner}]` : inner;
  }
  return "";
}

describe("locale resolution", () => {
  test("browser languages pick the first supported base language", () => {
    expect(detectLocale(["fr-FR", "de-AT", "en"])).toBe("de");
    expect(detectLocale(["zh-TW"])).toBe("zh");
    expect(detectLocale(["fr"])).toBe("en");
    expect(detectLocale(undefined)).toBe("en");
    expect(resolveLocale("es", ["de"])).toBe("es");
    expect(resolveLocale("auto", ["es-MX"])).toBe("es");
  });
});

describe("translator", () => {
  const messages: MessageTree = {
    hello: "Hello {name}",
    blocks: { one: "{count} block", other: "{count} blocks" },
    group: { nested: "Nested" },
    rich: "Read the <link>terms of <b>use</b></link>.",
  };
  test("interpolates, pluralises, nests and falls back", () => {
    const t = createTranslator("en", messages, undefined);
    expect(t("hello", { name: "Chia" })).toBe("Hello Chia");
    expect(t("blocks", { count: 1 })).toBe("1 block");
    expect(t("blocks", { count: 1234 })).toBe("1,234 blocks");
    expect(t("group.nested")).toBe("Nested");
    expect(t("missing")).toBe("missing");
    const german = createTranslator("de", { hello: "Hallo {name}" }, messages);
    expect(german("hello", { name: "Chia" })).toBe("Hallo Chia");
    expect(german("group.nested")).toBe("Nested");
    expect(german("blocks", { count: 1234 })).toBe("1.234 blocks");
  });
  test("rich text renders tags with the given functions", () => {
    const t = createTranslator("en", messages, undefined);
    const node = t.rich("rich", {
      link: (chunks) => <a href="/terms">{chunks}</a>,
      b: (chunks) => <b>{chunks}</b>,
    });
    expect(text(node)).toBe("Read the [a:terms of [b:use]].");
  });
});

describe("formatting follows the active locale", () => {
  test("numbers, amounts and times", () => {
    const now = 1_000_000_000_000;
    try {
      setActiveLocale("de");
      expect(formatXch(1_234_567_890_123_456n)).toBe("1.234,567890123456");
      expect(formatAmount(604585170n)).toBe("0,0006045 XCH");
      expect(formatFeeRate(7.5023)).toBe("7,50");
      expect(formatAge(now - 5 * 60_000, now)).toBe("5m ago"); // German messages not loaded here
      setActiveLocale("en");
      expect(formatXch(1_234_567_890_123_456n)).toBe("1,234.567890123456");
      expect(formatEta(150)).toBe("~3 min");
    } finally {
      setActiveLocale("en");
    }
  });
});

/** Every `{placeholder}` and `<tag>` of a message, so translations cannot drop or rename one. */
function tokens(leaf: string | Plural): string[] {
  const texts = typeof leaf === "string" ? [leaf] : Object.values(leaf).filter(Boolean);
  const found = new Set<string>();
  for (const s of texts as string[]) {
    for (const m of s.matchAll(/\{(\w+)\}/g)) if (m[1] !== "count") found.add(`{${m[1]}}`);
    for (const m of s.matchAll(/<\/?(\w+)>/g)) found.add(`<${m[1]}>`);
  }
  return [...found].sort();
}

function leaves(tree: MessageTree, prefix = ""): [string, string | Plural][] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [[path, value]];
    if (typeof (value as Plural).other === "string") return [[path, value as Plural]];
    return leaves(value as MessageTree, path);
  });
}

describe("message files", () => {
  const english = leaves(en as unknown as MessageTree);
  const translations = { de, es, zh } as const;
  test("locales list matches the message sets", () => {
    expect([...LOCALES].sort()).toEqual(["de", "en", "es", "zh"]);
  });
  for (const [locale, messages] of Object.entries(translations)) {
    test(`${locale} keeps every placeholder and tag of the English message`, () => {
      const translated = new Map(leaves(messages as unknown as MessageTree));
      const problems: string[] = [];
      for (const [key, leaf] of english) {
        const other = translated.get(key);
        if (other === undefined) {
          problems.push(`${key}: missing`);
          continue;
        }
        const values = typeof other === "string" ? [other] : Object.values(other);
        if (values.some((v) => typeof v === "string" && v.trim() === "")) {
          problems.push(`${key}: empty`);
        }
        const a = tokens(leaf).join(" ");
        const b = tokens(other).join(" ");
        if (a !== b) problems.push(`${key}: en has [${a}], ${locale} has [${b}]`);
      }
      expect(problems).toEqual([]);
    });
  }
});
