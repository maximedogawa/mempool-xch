"use client";

import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  type WheelEvent,
} from "react";
import { useT } from "@/shared/i18n/useT";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { regionColor } from "@/shared/lib/map/colors";
import { LAND_RUNS } from "@/shared/lib/map/landDots";
import { cellCenter, GRID_STEP, MAP_HEIGHT, MAP_WIDTH, project } from "@/shared/lib/map/projection";
import type { CountryRow } from "@/shared/lib/map/stats";
import { useMapNames } from "./useMapNames";
import mapNs from "@/shared/i18n/messages/en/map";

export interface MapPulse {
  id: number;
  countryKey: string;
  kind: "block" | "bundle";
}

export interface PeerMarker {
  host: string;
  lat: number;
  lon: number;
  label: string;
  /** City/country line plus the network operator, when GeoJS knows one. */
  org: string | null;
}

/** Dot spacing in SVG units: one land dot per grid cell. */
const DOT_STEP = (GRID_STEP / 360) * MAP_WIDTH;
const DOT_SIZE = 2.4;
export const MIN_SCALE = 1;
export const MAX_SCALE = 8;
/** Below this zoom a marker's country name would collide with its neighbours. */
const LABEL_SCALE = 2.2;

export interface MapHandle {
  zoomBy: (factor: number) => void;
  reset: () => void;
  /** Frames the given points, or the whole world when the list is empty. */
  fit: (points: readonly { lat: number; lon: number }[]) => void;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

const WORLD: View = { scale: 1, x: 0, y: 0 };

/** Keeps the scaled map covering the viewport, so panning can never reveal empty space. */
function clamp(view: View): View {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale));
  return {
    scale,
    x: Math.min(0, Math.max(MAP_WIDTH * (1 - scale), view.x)),
    y: Math.min(0, Math.max(MAP_HEIGHT * (1 - scale), view.y)),
  };
}

/** Marker radius in SVG units: area tracks the node count, with a floor for single-node countries. */
function markerRadius(nodes: number, largest: number): number {
  const ratio = largest > 0 ? Math.sqrt(nodes) / Math.sqrt(largest) : 0;
  return 2.2 + ratio * 12;
}

/**
 * Dot-matrix world map of the Chia full-node population. The land is one path (a run of round
 * dashes per row of land cells), each reported country is a marker sized by its node count and
 * coloured by region, a configured node's own peers get their own marker, and live events
 * ripple out of the countries they are modelled to reach. Pan, wheel-zoom, double-click and the
 * arrow keys move the view; markers are focusable and clickable.
 */
export function WorldMap({
  countries,
  peers,
  pulses,
  hovered,
  onHover,
  selected,
  onSelect,
  matched,
  filtered,
  showArcs = true,
  handleRef,
  onViewChange,
}: {
  countries: CountryRow[];
  peers: PeerMarker[];
  pulses: MapPulse[];
  hovered: string | null;
  onHover: (key: string | null) => void;
  selected: string | null;
  onSelect: (key: string | null) => void;
  /** Keys passing the current search/region filter; others render faint and inert. */
  matched: ReadonlySet<string>;
  /** True while a filter is narrowing the map, which mutes everything unmatched. */
  filtered: boolean;
  showArcs?: boolean;
  handleRef?: RefObject<MapHandle | null>;
  onViewChange?: (scale: number) => void;
}) {
  const t = useT(mapNs);
  const names = useMapNames();
  const [view, setView] = useState<View>(WORLD);
  /** The live view, ahead of React state while a drag is in flight. */
  const viewRef = useRef<View>(WORLD);
  const stage = useRef<SVGGElement | null>(null);
  const drag = useRef<{
    x: number;
    y: number;
    originX: number;
    originY: number;
    moved: boolean;
    frame: number | null;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const land = useMemo(() => {
    const segments: string[] = [];
    LAND_RUNS.forEach((runs, row) => {
      for (let i = 0; i < runs.length; i += 2) {
        const start = cellCenter(runs[i]!, row);
        const length = (runs[i + 1]! - 1) * DOT_STEP;
        segments.push(`M${start.x} ${start.y}h${Math.max(0.01, length).toFixed(1)}`);
      }
    });
    return segments.join("");
  }, []);

  /** Placeable countries only, smallest first so big markers do not bury small ones. */
  const markers = useMemo(
    () =>
      countries
        .filter((country) => country.lat !== null && country.lon !== null)
        .map((country) => ({ ...country, pos: project(country.lon!, country.lat!) }))
        .sort((a, b) => b.nodes - a.nodes),
    [countries]
  );
  const drawOrder = useMemo(() => [...markers].reverse(), [markers]);
  const positions = useMemo(
    () => new Map(markers.map((marker) => [marker.key, marker.pos])),
    [markers]
  );
  const largest = markers[0]?.nodes ?? 0;
  const total = countries.reduce((sum, country) => sum + country.nodes, 0);

  /**
   * Pans and zooms by writing the transform straight onto the group, and only syncs React
   * state when `commit` is set. A drag moves 113 markers and a land path every pointermove, so
   * re-rendering that tree per event is what made dragging feel heavy.
   */
  const apply = useCallback(
    (next: View, commit = true) => {
      const clamped = clamp(next);
      viewRef.current = clamped;
      stage.current?.setAttribute(
        "transform",
        `translate(${clamped.x} ${clamped.y}) scale(${clamped.scale})`
      );
      if (!commit) return;
      setView(clamped);
      onViewChange?.(clamped.scale);
    },
    [onViewChange]
  );

  /** Zooms about the map's centre, or about a point in SVG units when one is given. */
  const zoomBy = useCallback(
    (factor: number, at?: { x: number; y: number }) => {
      const current = viewRef.current;
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
      const k = scale / current.scale;
      const anchor = at ?? { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
      apply({
        scale,
        x: anchor.x - (anchor.x - current.x) * k,
        y: anchor.y - (anchor.y - current.y) * k,
      });
    },
    [apply]
  );

  const fit = useCallback(
    (points: readonly { lat: number; lon: number }[]) => {
      if (points.length === 0) {
        apply(WORLD);
        return;
      }
      const projected = points.map((point) => project(point.lon, point.lat));
      const minX = Math.min(...projected.map((p) => p.x));
      const maxX = Math.max(...projected.map((p) => p.x));
      const minY = Math.min(...projected.map((p) => p.y));
      const maxY = Math.max(...projected.map((p) => p.y));
      // Pad the box so markers near its edge keep their halo and label on screen.
      const pad = 90;
      const width = Math.max(maxX - minX + pad * 2, MAP_WIDTH / MAX_SCALE);
      const height = Math.max(maxY - minY + pad * 2, MAP_HEIGHT / MAX_SCALE);
      const scale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Math.min(MAP_WIDTH / width, MAP_HEIGHT / height))
      );
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      apply({ scale, x: MAP_WIDTH / 2 - cx * scale, y: MAP_HEIGHT / 2 - cy * scale });
    },
    [apply]
  );

  useImperativeHandle(
    handleRef,
    () => ({ zoomBy: (factor) => zoomBy(factor), reset: () => apply(WORLD), fit }),
    [zoomBy, apply, fit]
  );

  /** Client coordinates to SVG user units, before the pan/zoom transform. */
  const toSvg = (event: { clientX: number; clientY: number }, element: SVGSVGElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * MAP_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * MAP_HEIGHT,
    };
  };

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    // Only a primary button drag pans; a touch at scale 1 is left to the page so it can scroll.
    if (event.button !== 0) return;
    if (event.pointerType === "touch" && viewRef.current.scale === 1) return;
    // Focus by hand: the browser's own focus would scroll this tall map into view under the
    // pointer, yanking the page away mid-click.
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      originX: viewRef.current.x,
      originY: viewRef.current.y,
      moved: false,
      frame: null,
    };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const state = drag.current;
    if (!state) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = ((event.clientX - state.x) / rect.width) * MAP_WIDTH;
    const dy = ((event.clientY - state.y) / rect.height) * MAP_HEIGHT;
    if (Math.abs(dx) + Math.abs(dy) > 3) state.moved = true;
    if (state.frame !== null) return;
    // One transform write per animation frame, however fast the pointer reports.
    state.frame = requestAnimationFrame(() => {
      state.frame = null;
      apply({ scale: viewRef.current.scale, x: state.originX + dx, y: state.originY + dy }, false);
    });
  };

  const stopDrag = (event: PointerEvent<SVGSVGElement>) => {
    const state = drag.current;
    if (!state) return;
    if (state.frame !== null) cancelAnimationFrame(state.frame);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    // The drag's last position is only in the DOM; commit it so React state agrees again.
    apply(viewRef.current);
    setDragging(false);
    // Let the click handler see that this pointer sequence was a pan, then forget it.
    const moved = state.moved;
    drag.current = { ...state, moved, frame: null };
    requestAnimationFrame(() => {
      drag.current = null;
    });
  };

  /**
   * A bare wheel belongs to the page: hijacking it traps the reader on a full-width map. Zoom
   * is on the modifier, the buttons, a double-click and the keyboard instead.
   */
  const onWheel = (event: WheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) return;
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.18 : 1 / 1.18, toSvg(event, event.currentTarget));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const live = viewRef.current;
    const step = 60 / live.scale;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      apply({ scale: live.scale, x: live.x + move[0], y: live.y + move[1] });
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1.35);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomBy(1 / 1.35);
    } else if (event.key === "0" || event.key === "Escape") {
      event.preventDefault();
      apply(WORLD);
    }
  };

  /**
   * A click that ended a drag is a pan, not a selection. A marker's click also stops here, or
   * it would bubble to the background handler and clear the selection it just made.
   */
  const clickable =
    (fn: () => void, stop = false) =>
    (event: { stopPropagation: () => void }) => {
      if (stop) event.stopPropagation();
      if (drag.current?.moved) return;
      fn();
    };

  const showLabels = view.scale >= LABEL_SCALE;

  return (
    <div className="map-viewport relative overflow-hidden rounded-card">
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="group"
        aria-label={t("worldMap.label", { nodes: total, countries: countries.length })}
        className="map-canvas block h-auto w-full select-none"
        tabIndex={0}
        style={{
          // Zoomed out the map is a picture the page scrolls past; zoomed in it takes the drag.
          touchAction: view.scale > 1 ? "none" : "pan-y",
          cursor: dragging ? "grabbing" : "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        onDoubleClick={(event) => zoomBy(1.6, toSvg(event, event.currentTarget))}
        onClick={clickable(() => onSelect(null))}
      >
        <defs>
          <radialGradient id="map-marker-glow">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={stage} transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <path
            d={land}
            fill="none"
            stroke="var(--map-land)"
            strokeWidth={DOT_SIZE}
            strokeLinecap="round"
            strokeDasharray={`0 ${DOT_STEP.toFixed(2)}`}
          />

          {/* Modelled reach: arcs from the largest country to the next few, drawn faintly. */}
          {showArcs && markers.length > 1 ? (
            <g aria-hidden="true">
              {markers.slice(1, 9).map((marker) => {
                const from = markers[0]!.pos;
                const to = marker.pos;
                const lift = Math.min(90, Math.abs(to.x - from.x) * 0.22 + 20);
                return (
                  <path
                    key={`arc:${marker.key}`}
                    className="map-arc"
                    d={`M${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - lift} ${to.x} ${to.y}`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={1 / view.scale}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          ) : null}

          <g aria-hidden="true">
            {pulses.map((pulse) => {
              const pos = positions.get(pulse.countryKey);
              if (!pos) return null;
              return (
                <circle
                  key={pulse.id}
                  className="map-pulse"
                  cx={pos.x}
                  cy={pos.y}
                  r={7}
                  fill="none"
                  stroke={pulse.kind === "block" ? "var(--warning)" : "var(--primary)"}
                  strokeWidth={1.6}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          <g>
            {drawOrder.map((marker) => {
              const radius = markerRadius(marker.nodes, largest);
              const active = hovered === marker.key || selected === marker.key;
              const dim = filtered && !matched.has(marker.key);
              const color = regionColor(marker.region);
              return (
                <g
                  key={marker.key}
                  className={`map-node${dim ? " map-node-dim" : ""}`}
                  style={{ color }}
                  onMouseEnter={dim ? undefined : () => onHover(marker.key)}
                  onMouseLeave={dim ? undefined : () => onHover(null)}
                  onFocus={() => onHover(marker.key)}
                  onBlur={() => onHover(null)}
                  onClick={clickable(() => {
                    if (!dim) onSelect(selected === marker.key ? null : marker.key);
                  }, true)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    event.stopPropagation();
                    onSelect(selected === marker.key ? null : marker.key);
                  }}
                  tabIndex={dim ? -1 : 0}
                  role="button"
                  aria-pressed={selected === marker.key}
                  aria-label={t("worldMap.marker", {
                    country: names.country(marker),
                    count: marker.nodes,
                    rank: marker.rank,
                  })}
                >
                  {active ? (
                    <circle
                      cx={marker.pos.x}
                      cy={marker.pos.y}
                      r={radius * 2.6 + 6}
                      fill="url(#map-marker-glow)"
                    />
                  ) : null}
                  <circle
                    cx={marker.pos.x}
                    cy={marker.pos.y}
                    r={radius + 3}
                    fill={color}
                    fillOpacity={active ? 0.34 : 0.14}
                  />
                  <circle
                    cx={marker.pos.x}
                    cy={marker.pos.y}
                    r={radius}
                    fill={color}
                    fillOpacity={active ? 1 : 0.82}
                    stroke={active ? "var(--fg)" : "var(--map-marker-edge)"}
                    strokeWidth={active ? 1.6 : 0.8}
                    vectorEffect="non-scaling-stroke"
                  />
                  {(showLabels || active) && !dim ? (
                    <text
                      className="map-label"
                      x={marker.pos.x}
                      y={marker.pos.y - radius - 5 / view.scale}
                      textAnchor="middle"
                      style={{ fontSize: `${11 / view.scale}px` }}
                    >
                      {marker.code !== "—" ? marker.code : names.country(marker)} ·{" "}
                      {formatNumber(marker.nodes)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>

          <g>
            {peers.map((peer) => {
              const pos = project(peer.lon, peer.lat);
              return (
                <g
                  key={peer.host}
                  className="map-peer"
                  role="img"
                  aria-label={t("worldMap.peer", { host: peer.host, place: peer.label })}
                >
                  <circle
                    className="map-peer-ring"
                    cx={pos.x}
                    cy={pos.y}
                    r={9}
                    fill="none"
                    stroke="var(--kind-offer)"
                    strokeWidth={1.4}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={pos.x} cy={pos.y} r={3} fill="var(--kind-offer)" />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
