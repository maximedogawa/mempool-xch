/**
 * Equirectangular projection shared by the land-dot generator and the map renderer. The
 * latitude window drops Antarctica and the polar sea so the map is wide rather than tall.
 */
export const LON_MIN = -180;
export const LON_MAX = 180;
export const LAT_MIN = -56;
export const LAT_MAX = 84;
/** Degrees per dot-matrix cell. */
export const GRID_STEP = 1.6;

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = Math.round((MAP_WIDTH * (LAT_MAX - LAT_MIN)) / (LON_MAX - LON_MIN));

export interface MapPoint {
  x: number;
  y: number;
}

/** Longitude/latitude to SVG user units; latitudes outside the window clamp to its edge. */
export function project(lon: number, lat: number): MapPoint {
  const clampedLat = Math.min(LAT_MAX, Math.max(LAT_MIN, lat));
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * MAP_WIDTH;
  const y = ((LAT_MAX - clampedLat) / (LAT_MAX - LAT_MIN)) * MAP_HEIGHT;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/** Centre of a dot-matrix cell, in SVG user units. */
export function cellCenter(col: number, row: number): MapPoint {
  return project(LON_MIN + (col + 0.5) * GRID_STEP, LAT_MAX - (row + 0.5) * GRID_STEP);
}
