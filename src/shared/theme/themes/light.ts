import { defineTheme } from "../define";

/**
 * Beidwerk canon v2, Papier (beidwerk-studio tokens/base.json + themes/mempoolxch.json): paper and
 * black ink, indigo as mempoolxch's one accent (CTA, active marks, focus, first data series),
 * verdigris as the second series, gold as matter (the p151 cube's top), zinnober only for
 * congestion and critical states. Borders, not shadows; square corners. Text tokens keep 4.5:1 on
 * --bg, --surface, --surface-2 and their own soft tint.
 */
export const light = defineTheme({
  id: "light",
  scheme: "light",
  /** Raw palette, emitted as `--name` and referenced from the tokens below. */
  palette: {
    canvas: "#f4f0e8",
    paper: "#fbf8f2",
    ink: "#1c1b19",
    graphite: "#5e5a52",
    indigo: "#2d3f80",
    verdigris: "#0f6464",
    neutral: "#8c867a",
    gold: "#8c6b3a",
    zinnober: "#b8321c",
    hairline: "#ddd6c8",
    soga: "#8a5a2b",
    green: "#2f6b4f",
    stone: "#8c867a",
  },
  tokens: {
    bg: "var(--canvas)",
    "bg-elevated": "var(--paper)",
    surface: "var(--paper)",
    "surface-2": "#ede7dc",
    "surface-hover": "#e6e0d4",
    border: "var(--hairline)",
    "border-strong": "#8c867a",
    /** Separators inside a card: a half-strength hairline. */
    rule: "color-mix(in srgb, var(--hairline) 60%, var(--paper))",
    "map-land": "#ddd6c8",
    "map-bg": "#ede7dc",
    "map-grid": "rgb(45 63 128 / 0.07)",
    "map-marker-edge": "rgb(251 248 242 / 0.9)",
    /** Region hues for the network map: size shows population, hue shows region. */
    "region-europe": "var(--indigo)",
    "region-asia": "var(--verdigris)",
    "region-north-america": "var(--gold)",
    "region-south-america": "var(--soga)",
    "region-africa": "var(--green)",
    "region-oceania": "var(--stone)",
    "region-unmapped": "#a9a397",
    fg: "var(--ink)",
    "fg-muted": "var(--graphite)",
    "fg-faint": "#615d55",
    /** Interactive: text, links, active marks and small fills. */
    primary: "#2d3f80",
    "primary-strong": "#24346b",
    "primary-tint": "color-mix(in srgb, var(--indigo) 28%, var(--paper))",
    "primary-soft": "color-mix(in srgb, var(--indigo) 12%, transparent)",
    "primary-fg": "#fbf8f2",
    /** Call to action: the one solid button colour, no gradient. */
    cta: "var(--indigo)",
    "cta-hover": "#24346b",
    "cta-fg": "#fbf8f2",
    "cta-edge": "color-mix(in srgb, var(--indigo) 82%, black)",
    focus: "var(--indigo)",
    /** A fresh row leaves a thin cyan trace, then settles. */
    "row-flash": "color-mix(in srgb, var(--indigo) 8%, transparent)",
    accent: "#2d3f80",
    warning: "#7a4f25",
    danger: "var(--zinnober)",
    "danger-soft": "color-mix(in srgb, var(--zinnober) 10%, transparent)",
    info: "var(--verdigris)",
    /** Fee bands, calm to pressure: cyan tint (0 fee, most of the mempool, so it must read as colour), light cyan, cyan, indigo, copper, brick. Strong enough to read as colour, light enough that ink text on a block cube keeps 5.6:1 or better. */
    "fee-0": "color-mix(in srgb, var(--indigo) 30%, var(--paper))",
    "fee-1": "color-mix(in srgb, var(--indigo) 50%, var(--paper))",
    "fee-2": "color-mix(in srgb, var(--indigo) 72%, var(--paper))",
    "fee-3": "color-mix(in srgb, var(--verdigris) 55%, var(--paper))",
    "fee-4": "color-mix(in srgb, var(--gold) 65%, var(--paper))",
    "fee-5": "color-mix(in srgb, var(--zinnober) 65%, var(--paper))",
    /** Block cube faces: mineral blocks with ink edges. */
    "block-face": "color-mix(in srgb, var(--indigo) 6%, #ede7dc)",
    "block-side": "color-mix(in srgb, var(--indigo) 12%, #ddd6c8)",
    "block-top": "color-mix(in srgb, var(--indigo) 5%, #f7f3ec)",
    "block-empty": "#e9e3d8",
    "projected-face": "color-mix(in srgb, var(--indigo) 8%, #ede7dc)",
    "cube-top-hi": "#fdfbf7",
    "cube-side-from": "color-mix(in srgb, var(--indigo) 12%, #e0d9cc)",
    "cube-side-to": "color-mix(in srgb, var(--indigo) 16%, #cfc7b8)",
    "cube-glass": "rgb(251 248 242 / 0.86)",
    "cube-grid": "rgb(28 27 25 / 0.05)",
    "cube-fill-shade": "rgb(28 27 25 / 0.06)",
    "cube-sheen": "rgb(251 248 242 / 0.08)",
    "cube-waterline": "rgb(28 27 25 / 0.4)",
    "cube-top-line": "rgb(251 248 242 / 0.6)",
    "cube-empty-edge": "inset 0 0 0 1px rgb(28 27 25 / 0.07)",
    "cube-edge": "inset 0 0 0 1px rgb(28 27 25 / 0.16)",
    "cube-drop": "0 12px 22px -16px rgb(28 27 25 / 0.32)",
    "cube-text-shadow": "none",
    "cube-dash": "rgb(28 27 25 / 0.28)",
    /** A single-band fee fill fades toward this. */
    "cube-shade": "var(--paper)",
    "confirmed-fill":
      "linear-gradient(165deg, color-mix(in srgb, var(--indigo) 55%, var(--paper)) 0%, color-mix(in srgb, var(--indigo) 72%, var(--paper)) 100%)",
    "strip-bg":
      "linear-gradient(180deg, var(--paper), color-mix(in srgb, var(--indigo) 8%, var(--canvas)))",
    /**
     * Asset kinds: cyan and indigo first, then material hues. Badges tint with them; text is
     * ink.
     */
    "kind-xch": "var(--indigo)",
    "kind-cat": "var(--verdigris)",
    "kind-nft": "var(--soga)",
    "kind-did": "var(--gold)",
    "kind-offer": "var(--green)",
    "kind-unknown": "var(--neutral)",
    "badge-mix": "16%",
    /** Portfolio allocation donut: XCH, four tokens by value, grey "Other". */
    "alloc-0": "var(--indigo)",
    "alloc-1": "var(--verdigris)",
    "alloc-2": "var(--gold)",
    "alloc-3": "var(--soga)",
    "alloc-4": "var(--green)",
    "alloc-other": "#c9c1b3",
    shadow: "none",
    /** Effects: no light on the page; the next block keeps a soft indigo glow. No sheen. */
    "page-glow": "transparent",
    glow: "color-mix(in srgb, var(--indigo) 60%, transparent)",
    sheen: "none",
    "header-line": "var(--hairline)",
    /** Work areas stay still (doc-001 v2): no decorative loops. */
    ambient: "paused",
  },
});
