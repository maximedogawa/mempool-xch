"use client";

import Link from "next/link";
import { memo, useLayoutEffect, useRef, useState } from "react";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import type { Sensitivity } from "@/shared/lib/nft/sensitivity";
import { routes } from "@/shared/lib/routes";
import { AssetIcon } from "@/shared/ui";

/** Everything a tile needs to draw itself; built once per layout by GogglesTreemap. */
export interface TileView {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colour: string;
  dim: boolean;
  fresh: boolean;
  yours: boolean;
  /** Accessible name: tiles carry no visible text. */
  label: string;
  kind: TxKindHint;
  assetId?: string;
  /** NFT thumbnail (already cleared of flagged artwork), shown on large NFT tiles. */
  image: string | null;
  /** Show the asset icon (large enough, and among the largest tiles). */
  icon: boolean;
  sensitivity: Sensitivity | null;
}

export interface FrameView {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string | null;
}

interface Ghost {
  key: number;
  depart: boolean;
  label: string | null;
  tiles: TileView[];
}

const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
/** Tiles that stay glide to their new cell. */
const MOVE_MS = 360;
/** New bundles drop into the queue from above their cell. */
const ENTER_MS = 320;
/** Arrivals in one update land one after another, at most this far apart in total. */
const ENTER_STAGGER_MS = 120;
const LEAVE_MS = 200;
/** A confirmed block slides off toward the recent blocks. */
const DEPART_MS = 700;
/** Leave at most this many fading ghosts at once; beyond it tiles simply vanish. */
const MAX_GHOSTS = 600;

/** The tile's own size, one pixel smaller than its cell so neighbours stay apart. */
const drawn = (v: number) => Math.max(0, v - 1);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function TileBody({ tile }: { tile: TileView }) {
  return (
    <>
      {tile.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tile.image}
          alt=""
          loading="lazy"
          decoding="async"
          // A missing thumbnail leaves the plain tile colour, not a broken-image glyph.
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
          className="goggles-tile-image pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      ) : tile.icon ? (
        <span className="goggles-tile-icon pointer-events-none absolute left-1 top-1">
          <AssetIcon
            kind={tile.kind}
            assetId={tile.assetId}
            size={14}
            sensitivity={tile.sensitivity}
            className="rounded-full"
          />
        </span>
      ) : null}
      {tile.yours ? <span aria-hidden="true" className="goggles-mark-yours" /> : null}
      {tile.fresh ? <span aria-hidden="true" className="goggles-mark-new" /> : null}
    </>
  );
}

/**
 * The tiles of the treemap: absolutely positioned links moved with CSS transforms. Layout
 * changes animate FLIP-style with the Web Animations API (transform and opacity only, so the
 * compositor does the work): tiles that stay glide and resize from their old cell, new ones drop
 * into the queue from above in a short stagger, departed ones fade out as ghosts, and a
 * confirmed block slides off toward the recent blocks. Nothing animates while the tab is hidden;
 * reduced motion keeps only the fades.
 * Memoised: hover and tooltip state live in the parent and never re-render the tiles.
 */
export const GogglesTiles = memo(function GogglesTiles({
  tiles,
  frames,
  activeId,
  departure,
  canvasWidth,
  canvasHeight,
}: {
  tiles: TileView[];
  frames: FrameView[];
  /** The one tile in the tab order (roving tabindex). */
  activeId: string | null;
  /** Set (with a new key) when the previous block was confirmed; its label names the block. */
  departure: { key: number; label: string } | null;
  canvasWidth: number;
  canvasHeight: number;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const ghostLayer = useRef<HTMLDivElement>(null);
  const previous = useRef<Map<string, TileView> | null>(null);
  const lastDeparture = useRef<number | null>(departure?.key ?? null);
  const ghostSeq = useRef(0);
  const [ghosts, setGhosts] = useState<Ghost[]>([]);

  useLayoutEffect(() => {
    const prev = previous.current;
    const next = new Map(tiles.map((t) => [t.id, t]));
    previous.current = next;
    const departing = departure !== null && departure.key !== lastDeparture.current;
    lastDeparture.current = departure?.key ?? null;
    // First paint, background tab: just show the result.
    if (!prev || document.hidden || !layer.current) return;
    const reduced = prefersReducedMotion();
    const elements = [...layer.current.querySelectorAll<HTMLElement>("[data-tile]")];
    const arrivals = elements.filter((el) => departing || !prev.has(el.dataset.id ?? "")).length;
    let arrived = 0;
    elements.forEach((el) => {
      const tile = next.get(el.dataset.id ?? "");
      if (!tile) return;
      const old = prev.get(tile.id);
      const to = `translate(${tile.x}px, ${tile.y}px)`;
      if (!old || departing) {
        // Top of the block first, as if the queue were settling into it.
        const stagger = arrivals > 1 ? (arrived++ / (arrivals - 1)) * ENTER_STAGGER_MS : 0;
        const drop = Math.min(28, Math.max(10, tile.height * 0.6));
        el.animate(
          reduced
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                { opacity: 0, transform: `translate(${tile.x}px, ${tile.y - drop}px)` },
                { opacity: 1, transform: to },
              ],
          {
            duration: ENTER_MS,
            delay: (departing ? 240 : 0) + (reduced ? 0 : stagger),
            easing: EASE,
            fill: "backwards",
          }
        );
        return;
      }
      const moved =
        Math.abs(old.x - tile.x) > 0.5 ||
        Math.abs(old.y - tile.y) > 0.5 ||
        Math.abs(old.width - tile.width) > 0.5 ||
        Math.abs(old.height - tile.height) > 0.5;
      if (!moved) return;
      if (reduced) {
        el.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
        return;
      }
      const sx = drawn(tile.width) > 0 ? drawn(old.width) / drawn(tile.width) : 1;
      const sy = drawn(tile.height) > 0 ? drawn(old.height) / drawn(tile.height) : 1;
      el.animate(
        [{ transform: `translate(${old.x}px, ${old.y}px) scale(${sx}, ${sy})` }, { transform: to }],
        { duration: MOVE_MS, easing: EASE }
      );
    });
    const leaving = departing
      ? [...prev.values()]
      : [...prev.values()].filter((t) => !next.has(t.id));
    if (leaving.length === 0 || leaving.length > MAX_GHOSTS) return;
    ghostSeq.current += 1;
    const ghost: Ghost = {
      key: ghostSeq.current,
      depart: departing,
      label: departing ? (departure?.label ?? null) : null,
      tiles: leaving.map((t) => ({ ...t, dim: false })),
    };
    // Drawn before the browser paints (layout effect), so the old block never blinks out.
    setGhosts((current) => [...current.filter((g) => !departing || !g.depart), ghost]);
  }, [tiles, departure]);

  // Animate each ghost batch once, then drop it.
  useLayoutEffect(() => {
    const root = ghostLayer.current;
    if (!root) return;
    const reduced = prefersReducedMotion();
    root.querySelectorAll<HTMLElement>("[data-ghost]:not([data-animated])").forEach((el) => {
      el.dataset.animated = "1";
      const key = Number(el.dataset.ghost);
      const depart = el.dataset.depart === "1";
      const done = () => setGhosts((current) => current.filter((g) => g.key !== key));
      const animation = el.animate(
        reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : depart
            ? [
                { opacity: 1, transform: "translate(0, 0) scale(1)" },
                { opacity: 0.85, transform: "translate(22%, 0) scale(0.9)", offset: 0.4 },
                { opacity: 0, transform: "translate(80%, 0) scale(0.7)" },
              ]
            : [{ opacity: 1 }, { opacity: 0 }],
        {
          duration: reduced ? 200 : depart ? DEPART_MS : LEAVE_MS,
          easing: depart ? "cubic-bezier(0.55, 0, 0.7, 0.2)" : "ease-out",
          fill: "forwards",
        }
      );
      animation.onfinish = done;
      animation.oncancel = done;
    });
  }, [ghosts]);

  return (
    <>
      <div ref={layer} className="absolute inset-0">
        {tiles.map((tile) => (
          <Link
            key={tile.id}
            href={routes.tx(tile.id)}
            prefetch={false}
            data-tile=""
            data-id={tile.id}
            aria-label={tile.label}
            tabIndex={tile.id === activeId ? 0 : -1}
            className="goggles-tile"
            data-dim={tile.dim ? "" : undefined}
            style={{
              width: drawn(tile.width),
              height: drawn(tile.height),
              transform: `translate(${tile.x}px, ${tile.y}px)`,
              backgroundColor: tile.colour,
            }}
          >
            <TileBody tile={tile} />
          </Link>
        ))}
      </div>
      {frames.length > 0 ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {frames.map((frame) => (
            <div
              key={frame.key}
              className="goggles-frame"
              style={{
                width: frame.width,
                height: frame.height,
                transform: `translate(${frame.x}px, ${frame.y}px)`,
              }}
            >
              {frame.label && frame.width >= 64 && frame.height >= 24 ? (
                <span className="goggles-frame-label">{frame.label}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <div ref={ghostLayer} aria-hidden="true" className="pointer-events-none absolute inset-0">
        {ghosts.map((ghost) => (
          <div
            key={ghost.key}
            data-ghost={ghost.key}
            data-depart={ghost.depart ? "1" : "0"}
            className="absolute inset-0"
            style={{
              transformOrigin: `${canvasWidth}px ${canvasHeight / 2}px`,
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            {ghost.tiles.map((tile) => (
              <div
                key={tile.id}
                className="goggles-tile"
                style={{
                  width: drawn(tile.width),
                  height: drawn(tile.height),
                  transform: `translate(${tile.x}px, ${tile.y}px)`,
                  backgroundColor: tile.colour,
                }}
              />
            ))}
            {ghost.label ? <span className="goggles-depart-label">{ghost.label}</span> : null}
          </div>
        ))}
      </div>
    </>
  );
});
