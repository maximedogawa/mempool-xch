/**
 * Squarified treemap layout (Bruls, Huizing, van Wijk) for the block content visualisation:
 * cells sized by CLVM cost, coloured by fee per cost by the renderer. Pure and unit tested.
 */
export interface TreemapInput<T> {
  item: T;
  /** Positive weight; zero-weight items are dropped. */
  weight: number;
}

export interface TreemapCell<T> {
  item: T;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function worstRatio(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  if (sum === 0 || side === 0) return Infinity;
  const max = Math.max(...row);
  const min = Math.min(...row);
  const s2 = side * side;
  return Math.max((s2 * max) / (sum * sum), (sum * sum) / (s2 * min));
}

function layoutRow<T>(
  row: TreemapInput<T>[],
  areas: number[],
  rect: Rect,
  cells: TreemapCell<T>[]
): Rect {
  const sum = areas.reduce((a, b) => a + b, 0);
  const horizontal = rect.width >= rect.height;
  // The row spans the shorter side; its thickness is proportional to the area it covers.
  if (horizontal) {
    const thickness = sum / rect.height;
    let y = rect.y;
    row.forEach((input, i) => {
      const h = (areas[i] ?? 0) / thickness;
      cells.push({ item: input.item, x: rect.x, y, width: thickness, height: h });
      y += h;
    });
    return { x: rect.x + thickness, y: rect.y, width: rect.width - thickness, height: rect.height };
  }
  const thickness = sum / rect.width;
  let x = rect.x;
  row.forEach((input, i) => {
    const w = (areas[i] ?? 0) / thickness;
    cells.push({ item: input.item, x, y: rect.y, width: w, height: thickness });
    x += w;
  });
  return { x: rect.x, y: rect.y + thickness, width: rect.width, height: rect.height - thickness };
}

export function squarify<T>(
  inputs: TreemapInput<T>[],
  width: number,
  height: number
): TreemapCell<T>[] {
  const items = inputs.filter((i) => i.weight > 0).sort((a, b) => b.weight - a.weight);
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (items.length === 0 || total <= 0 || width <= 0 || height <= 0) return [];
  const scale = (width * height) / total;
  const cells: TreemapCell<T>[] = [];
  let rect: Rect = { x: 0, y: 0, width, height };
  let row: TreemapInput<T>[] = [];
  let areas: number[] = [];

  items.forEach((input) => {
    const area = input.weight * scale;
    const side = Math.min(rect.width, rect.height);
    if (row.length === 0 || worstRatio([...areas, area], side) <= worstRatio(areas, side)) {
      row.push(input);
      areas.push(area);
      return;
    }
    rect = layoutRow(row, areas, rect, cells);
    row = [input];
    areas = [area];
  });
  if (row.length > 0) layoutRow(row, areas, rect, cells);
  return cells;
}
