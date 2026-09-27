/**
 * Writes the theme CSS for the app and the embeds from src/shared/theme. Run after changing or
 * adding a theme; src/shared/theme/themes.test.ts fails while either file is stale.
 */
import { writeFileSync } from "node:fs";
import { renderThemesCss } from "../../src/shared/theme/css";
import { THEMES } from "../../src/shared/theme";

export const OUTPUTS = ["src/shared/theme/themes.generated.css", "public/embed/themes.css"];

const css = renderThemesCss(THEMES);
for (const path of OUTPUTS) writeFileSync(path, css);
console.log(`Wrote ${THEMES.length} themes to ${OUTPUTS.join(", ")}`);
