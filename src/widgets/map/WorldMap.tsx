"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { LAND_RUNS } from "@/shared/lib/map/landDots";
import { cellCenter, GRID_STEP, MAP_HEIGHT, MAP_WIDTH, project } from "@/shared/lib/map/projection";
import type { NodeCluster } from "@/shared/lib/map/registry";
import { formatNumber } from "@/shared/lib/chia/amounts";

export interface MapPulse {
  id: number;
  clusterKey: string;
  kind: "block" | "bundle";
}

export interface PeerMarker {
  host: string;
  lat: number;
  lon: number;
  label: string;
}

/** Dot spacing in SVG units: one land dot per grid cell. */
const DOT_STEP = (GRID_STEP / 360) * MAP_WIDTH;
const DOT_SIZE = 2.4;

function markerRadius(count: number): number {
  return Math.min(9, 2.2 + Math.sqrt(count) * 1.1);
}

function clusterCount(cluster: NodeCluster): number {
  return cluster.count ?? cluster.nodes.length;
}

/**
 * Dot-matrix world map: the land is a single path (one horizontal segment per run of land
 * cells, drawn as round dashes), observed nodes are clusters sized by count, connected peers
 * of a custom node get their own colour, and live events pulse out of random clusters.
 */
export function WorldMap({
  clusters,
  peers,
  pulses,
  hovered,
  onHover,
  focus,
}: {
  clusters: NodeCluster[];
  peers: PeerMarker[];
  pulses: MapPulse[];
  hovered: string | null;
  onHover: (key: string | null) => void;
  focus?: { lat: number; lon: number } | null;
}) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
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
  const positions = useMemo(
    () => new Map(clusters.map((c) => [c.key, project(c.lon, c.lat)])),
    [clusters]
  );
  const total = clusters.reduce((s, c) => s + clusterCount(c), 0);
  useEffect(() => {
    if (!focus) return;
    const point = project(focus.lon, focus.lat);
    setView((current) => ({
      ...current,
      x: MAP_WIDTH / 2 - point.x * current.scale,
      y: MAP_HEIGHT / 2 - point.y * current.scale,
    }));
  }, [focus]);
  const zoom = (factor: number) =>
    setView((current) => ({ ...current, scale: Math.min(5, Math.max(1, current.scale * factor)) }));
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, originX: view.x, originY: view.y };
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const unitX = MAP_WIDTH / rect.width / view.scale;
    const unitY = MAP_HEIGHT / rect.height / view.scale;
    setView((current) => ({
      ...current,
      x: drag.current!.originX + (event.clientX - drag.current!.x) * unitX,
      y: drag.current!.originY + (event.clientY - drag.current!.y) * unitY,
    }));
  };
  const stopDrag = () => {
    drag.current = null;
  };
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  return (
    <div className="map-viewport relative overflow-hidden rounded-sm" onWheel={onWheel}>
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-sm border border-primary/30 bg-bg-elevated/90 px-2 py-1 text-[10px] uppercase tracking-wider text-primary">
        drag · wheel to zoom
      </div>
      <div className="absolute right-3 top-3 z-10 flex overflow-hidden rounded-sm border border-border bg-bg-elevated/90">
        <button type="button" aria-label="Zoom in" className="map-control" onClick={() => zoom(1.35)}>
          +
        </button>
        <button type="button" aria-label="Zoom out" className="map-control" onClick={() => zoom(1 / 1.35)}>
          −
        </button>
        <button type="button" aria-label="Reset map view" className="map-control map-control-wide" onClick={() => setView({ scale: 1, x: 0, y: 0 })}>
          reset
        </button>
      </div>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        role="group"
        aria-label={`World map of ${formatNumber(total)} observed Chia nodes in ${clusters.length} places`}
        className="block h-auto w-full select-none"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
      <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
      <path
        d={land}
        fill="none"
        stroke="var(--map-land)"
        strokeWidth={DOT_SIZE}
        strokeLinecap="round"
        strokeDasharray={`0 ${DOT_STEP.toFixed(2)}`}
      />
      <g>
        {pulses.map((p) => {
          const pos = positions.get(p.clusterKey);
          if (!pos) return null;
          return (
            <circle
              key={p.id}
              className="map-pulse"
              cx={pos.x}
              cy={pos.y}
              r={6}
              fill="none"
              stroke={p.kind === "block" ? "var(--warning)" : "var(--primary)"}
              strokeWidth={1.5}
            />
          );
        })}
      </g>
      <g>
        {clusters.map((c) => {
          const pos = positions.get(c.key)!;
          const count = clusterCount(c);
          const r = markerRadius(count);
          const active = hovered === c.key;
          return (
            <g
              key={c.key}
              className="map-node"
              onMouseEnter={() => onHover(c.key)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(c.key)}
              onBlur={() => onHover(null)}
              tabIndex={0}
              role="img"
              aria-label={`${c.label}: ${count} node${count === 1 ? "" : "s"}`}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 3}
                fill="var(--primary)"
                fillOpacity={active ? 0.35 : 0.14}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill="var(--primary)"
                fillOpacity={0.9}
                stroke="var(--bg)"
                strokeWidth={1}
              />
            </g>
          );
        })}
      </g>
      <g>
        {peers.map((p) => {
          const pos = project(p.lon, p.lat);
          return (
            <g key={p.host} role="img" aria-label={`Connected peer ${p.host} near ${p.label}`}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={7}
                fill="none"
                stroke="var(--kind-offer)"
                strokeWidth={1.5}
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
