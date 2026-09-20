/**
 * One colour per region, as a CSS variable so both themes and a future Sage theme remap it in
 * `globals.css` rather than here. Size on the map carries the node count; hue carries the region.
 */
import type { MapRegion } from "./countryPoints";
import { UNMAPPED } from "./stats";

const REGION_VARS: Record<MapRegion | typeof UNMAPPED, string> = {
  Europe: "--region-europe",
  Asia: "--region-asia",
  "North America": "--region-north-america",
  "South America": "--region-south-america",
  Africa: "--region-africa",
  Oceania: "--region-oceania",
  [UNMAPPED]: "--region-unmapped",
};

export function regionColor(region: MapRegion | typeof UNMAPPED): string {
  return `var(${REGION_VARS[region] ?? REGION_VARS[UNMAPPED]})`;
}
