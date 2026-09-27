import { defineTheme } from "../define";

/**
 * Beidwerk UI v2, light (backlog doc-001): cool mineral neutrals and black editorial ink, deep
 * cyan as the identity hue (CTA, active marks, focus, first data series), indigo as the second
 * series, graphite/slate for neutral data, copper and brick only for congestion and critical
 * states. Text tokens keep 4.5:1 on --bg, --surface, --surface-2 and their own soft tint, so a few
 * sit a step deeper than the raw palette: cyan text #0E656E (deep cyan is 4.35:1 on the canvas, and cyan text must also clear its own tinted chips),
 * copper text #8E5431, faint text #5A646B (slate is 3.5:1). Deep cyan carries the CTA at 4.8:1.
 */
export const light = defineTheme({
  id: "light",
  scheme: "light",
  /** Raw palette, emitted as `--name` and referenced from the tokens below. */
  palette: {
    canvas: "#eef0ed",
    paper: "#f8faf7",
    ink: "#15191d",
    graphite: "#4c555c",
    "deep-cyan": "#167b86",
    indigo: "#344d8c",
    slate: "#74808a",
    copper: "#a7663e",
    brick: "#9f4038",
    hairline: "#c4c9c6",
    brass: "#8a7a3c",
    patina: "#3f7a5e",
    steel: "#5e7a8c",
  },
  tokens: {
    bg: "var(--canvas)",
    "bg-elevated": "var(--paper)",
    surface: "var(--paper)",
    "surface-2": "#e8ebe7",
    "surface-hover": "#e1e5e1",
    border: "var(--hairline)",
    "border-strong": "#a3aaa7",
    /** Separators inside a card: a half-strength hairline. */
    rule: "color-mix(in srgb, var(--hairline) 60%, var(--paper))",
    "map-land": "#cbd1ce",
    "map-bg": "#e6e9e5",
    "map-grid": "rgb(22 123 134 / 0.07)",
    "map-marker-edge": "rgb(248 250 247 / 0.9)",
    /** Region hues for the network map: size shows population, hue shows region. */
    "region-europe": "var(--deep-cyan)",
    "region-asia": "var(--indigo)",
    "region-north-america": "var(--copper)",
    "region-south-america": "var(--brass)",
    "region-africa": "var(--patina)",
    "region-oceania": "var(--steel)",
    "region-unmapped": "#a0a8ad",
    fg: "var(--ink)",
    "fg-muted": "var(--graphite)",
    "fg-faint": "#5a646b",
    /** Interactive: text, links, active marks and small fills. */
    primary: "#0e656e",
    "primary-strong": "#0e5c64",
    "primary-tint": "color-mix(in srgb, var(--deep-cyan) 28%, var(--paper))",
    "primary-soft": "color-mix(in srgb, var(--deep-cyan) 12%, transparent)",
    "primary-fg": "#fffaf2",
    /** Call to action: the one solid button colour, no gradient. */
    cta: "var(--deep-cyan)",
    "cta-hover": "#12707a",
    "cta-fg": "#fffaf2",
    "cta-edge": "color-mix(in srgb, var(--deep-cyan) 82%, black)",
    focus: "var(--deep-cyan)",
    /** A fresh row leaves a thin cyan trace, then settles. */
    "row-flash": "color-mix(in srgb, var(--deep-cyan) 8%, transparent)",
    accent: "#0e656e",
    warning: "#8e5431",
    danger: "var(--brick)",
    "danger-soft": "color-mix(in srgb, var(--brick) 10%, transparent)",
    info: "var(--indigo)",
    /** Fee bands, calm to pressure: cyan tint (0 fee, most of the mempool, so it must read as colour), light cyan, cyan, indigo, copper, brick. Strong enough to read as colour, light enough that ink text on a block cube keeps 5.6:1 or better. */
    "fee-0": "color-mix(in srgb, var(--deep-cyan) 30%, var(--paper))",
    "fee-1": "color-mix(in srgb, var(--deep-cyan) 50%, var(--paper))",
    "fee-2": "color-mix(in srgb, var(--deep-cyan) 72%, var(--paper))",
    "fee-3": "color-mix(in srgb, var(--indigo) 55%, var(--paper))",
    "fee-4": "color-mix(in srgb, var(--copper) 65%, var(--paper))",
    "fee-5": "color-mix(in srgb, var(--brick) 65%, var(--paper))",
    /** Block cube faces: mineral blocks with ink edges. */
    "block-face": "color-mix(in srgb, var(--deep-cyan) 6%, #e8ebe8)",
    "block-side": "color-mix(in srgb, var(--deep-cyan) 12%, #cdd2cf)",
    "block-top": "color-mix(in srgb, var(--deep-cyan) 5%, #f4f6f3)",
    "block-empty": "#e4e7e3",
    "projected-face": "color-mix(in srgb, var(--deep-cyan) 8%, #e8ebe8)",
    "cube-top-hi": "#fbfcfa",
    "cube-side-from": "color-mix(in srgb, var(--deep-cyan) 12%, #d3d8d5)",
    "cube-side-to": "color-mix(in srgb, var(--deep-cyan) 16%, #bcc3bf)",
    "cube-glass": "rgb(248 250 247 / 0.86)",
    "cube-grid": "rgb(21 25 29 / 0.05)",
    "cube-fill-shade": "rgb(21 25 29 / 0.06)",
    "cube-sheen": "rgb(248 250 247 / 0.08)",
    "cube-waterline": "rgb(21 25 29 / 0.4)",
    "cube-top-line": "rgb(248 250 247 / 0.6)",
    "cube-empty-edge": "inset 0 0 0 1px rgb(21 25 29 / 0.07)",
    "cube-edge": "inset 0 0 0 1px rgb(21 25 29 / 0.16)",
    "cube-drop": "0 12px 22px -16px rgb(20 24 27 / 0.32)",
    "cube-text-shadow": "none",
    "cube-dash": "rgb(21 25 29 / 0.28)",
    /** A single-band fee fill fades toward this. */
    "cube-shade": "var(--paper)",
    "confirmed-fill":
      "linear-gradient(165deg, color-mix(in srgb, var(--deep-cyan) 55%, var(--paper)) 0%, color-mix(in srgb, var(--deep-cyan) 72%, var(--paper)) 100%)",
    "strip-bg":
      "linear-gradient(180deg, var(--paper), color-mix(in srgb, var(--deep-cyan) 8%, var(--canvas)))",
    /**
     * Asset kinds: cyan and indigo first, then material hues. Badges tint with them; text is
     * ink.
     */
    "kind-xch": "var(--deep-cyan)",
    "kind-cat": "var(--indigo)",
    "kind-nft": "var(--brass)",
    "kind-did": "var(--copper)",
    "kind-offer": "var(--patina)",
    "kind-unknown": "var(--slate)",
    "badge-mix": "16%",
    /** Portfolio allocation donut: XCH, four tokens by value, grey "Other". */
    "alloc-0": "var(--deep-cyan)",
    "alloc-1": "var(--indigo)",
    "alloc-2": "var(--copper)",
    "alloc-3": "var(--brass)",
    "alloc-4": "var(--patina)",
    "alloc-other": "#b5bcbf",
    shadow: "0 1px 0 rgb(20 24 27 / 0.03), 0 8px 24px rgb(20 24 27 / 0.06)",
    /** Effects: a soft cyan light on the top of the page and around the next block; no sheen. */
    "page-glow": "color-mix(in srgb, var(--deep-cyan) 16%, transparent)",
    glow: "color-mix(in srgb, var(--deep-cyan) 60%, transparent)",
    sheen: "none",
    "header-line": "var(--hairline)",
    /** Work areas stay still (doc-001 v2): no decorative loops. */
    ambient: "paused",
  },
});
