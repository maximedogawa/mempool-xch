"use client";

import { useMemo } from "react";
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
}: {
  clusters: NodeCluster[];
  peers: PeerMarker[];
  pulses: MapPulse[];
  hovered: string | null;
  onHover: (key: string | null) => void;
}) {
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
  const positions = useMemo(() => new Map(clusters.map((c) => [c.key, project(c.lon, c.lat)])), [clusters]);
  const total = clusters.reduce((s, c) => s + c.nodes.length, 0);

  return (
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="group" aria-label={`World map of ${formatNumber(total)} observed Chia nodes in ${clusters.length} places`} className="block h-auto w-full select-none">
      <path d={land} fill="none" stroke="var(--map-land)" strokeWidth={DOT_SIZE} strokeLinecap="round" strokeDasharray={`0 ${DOT_STEP.toFixed(2)}`} />
      <g>
        {pulses.map((p) => {
          const pos = positions.get(p.clusterKey);
          if (!pos) return null;
          return <circle key={p.id} className="map-pulse" cx={pos.x} cy={pos.y} r={6} fill="none" stroke={p.kind === "block" ? "var(--warning)" : "var(--primary)"} strokeWidth={1.5} />;
        })}
      </g>
      <g>
        {clusters.map((c) => {
          const pos = positions.get(c.key)!;
          const r = markerRadius(c.nodes.length);
          const active = hovered === c.key;
          return (
            <g key={c.key} className="map-node" onMouseEnter={() => onHover(c.key)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(c.key)} onBlur={() => onHover(null)} tabIndex={0} role="img" aria-label={`${c.label}: ${c.nodes.length} node${c.nodes.length === 1 ? "" : "s"}`}>
              <circle cx={pos.x} cy={pos.y} r={r + 3} fill="var(--primary)" fillOpacity={active ? 0.35 : 0.14} />
              <circle cx={pos.x} cy={pos.y} r={r} fill="var(--primary)" fillOpacity={0.9} stroke="var(--bg)" strokeWidth={1} />
            </g>
          );
        })}
      </g>
      <g>
        {peers.map((p) => {
          const pos = project(p.lon, p.lat);
          return (
            <g key={p.host} role="img" aria-label={`Connected peer ${p.host} near ${p.label}`}>
              <circle cx={pos.x} cy={pos.y} r={7} fill="none" stroke="var(--kind-offer)" strokeWidth={1.5} />
              <circle cx={pos.x} cy={pos.y} r={3} fill="var(--kind-offer)" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
