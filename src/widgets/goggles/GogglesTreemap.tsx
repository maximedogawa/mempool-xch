"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatCost, formatFeeRate, formatPercent } from "@/shared/lib/chia/amounts";
import { formatInteger } from "@/shared/i18n/number";
import { shortId } from "@/shared/lib/chia/hex";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import type { Sensitivity } from "@/shared/lib/nft/sensitivity";
import { cn } from "@/shared/lib/cn";
import { useT } from "@/shared/i18n/useT";
import { assetLines } from "./format";
import { GogglesTiles, type FrameView, type TileView } from "./GogglesTiles";
import { TileTooltip } from "./GogglesTooltip";
import { usePageVisible, useWidth } from "./hooks";
import {
  BLOCK_DEPTH,
  blockSide,
  detectDeparture,
  fillArea,
  groupItems,
  layoutGroups,
  neighbourTile,
  type ColourMode,
  type Direction,
  type GroupBy,
  type NonMatching,
} from "./model";
import { tileColour } from "./palette";
import gogglesNs from "@/shared/i18n/messages/en/goggles";

/** Tiles at least this big show their asset icon (and NFTs their artwork). */
const ICON_MIN = 30;
const IMAGE_MIN = 40;
/** Only the largest tiles get icons: bounded DOM and icon lookups with a full block. */
const MAX_ICONS = 60;
const HIDE_DELAY_MS = 140;

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

export interface TreemapContext {
  isFresh: (item: CompactMempoolItem) => boolean;
  isYours: (item: CompactMempoolItem) => boolean;
  /** Group key of a bundle when grouping by asset. */
  assetKey: (item: CompactMempoolItem) => string;
  groupLabel: (key: string) => string | null;
  ticker: (assetId: string) => string | undefined;
  nftImage: (launcherId: string) => string | null;
  nftName: (launcherId: string) => string | null;
  collectionName: (launcherId: string) => string | null;
  nftVerdict: (launcherId: string) => Sensitivity;
}

interface Tip {
  id: string;
  /** Opened by a tap: stays until tapped elsewhere; a second tap on the tile opens it. */
  pinned: boolean;
}

/** Capacity marks on the block's front face (share of the block cost limit). */
const SCALE = [0.25, 0.5, 0.75];

/**
 * The next block as an object: the same isometric top and side faces as the block cubes, and a
 * square front face whose capacity is the block cost limit. The treemap fills it from the bottom
 * (size = cost, colour = fee band or asset kind, no text on the tiles) up to a waterline labelled
 * with the fill; ruled marks at 25/50/75% measure the empty capacity above. Owns measuring,
 * layout, the anchored tooltip, keyboard movement and the empty-result state; drawing and
 * animation are GogglesTiles'.
 */
export function GogglesTreemap({
  items,
  matched,
  nonMatching,
  groupBy,
  colour,
  blockMaxCost,
  txHeight,
  label,
  ctx,
  emptyState,
}: {
  items: CompactMempoolItem[];
  /** Ids that pass the filters; null when no filter is active. */
  matched: ReadonlySet<string> | null;
  nonMatching: NonMatching;
  groupBy: GroupBy;
  colour: ColourMode;
  blockMaxCost: number;
  /** Height of the last transaction block, to recognise a confirmed block. */
  txHeight: number | null;
  label: string;
  ctx: TreemapContext;
  /** Shown over the canvas when filters match nothing. */
  emptyState: ReactNode;
}) {
  const t = useT(gogglesNs);
  const column = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const available = useWidth(column);
  // A square front face: width and height are the same side.
  const width = available > 0 ? blockSide(available) : 0;
  const height = width;
  const visible = usePageVisible();

  const shown = useMemo(
    () => (matched && nonMatching === "hide" ? items.filter((i) => matched.has(i.id)) : items),
    [items, matched, nonMatching]
  );
  const shownCost = useMemo(() => shown.reduce((s, i) => s + i.cost, 0), [shown]);
  const blockCost = useMemo(() => items.reduce((s, i) => s + i.cost, 0), [items]);
  const area = useMemo(
    () => fillArea(width, height, shownCost, blockMaxCost),
    [width, height, shownCost, blockMaxCost]
  );
  const layout = useMemo(
    () => layoutGroups(groupItems(shown, groupBy, ctx.assetKey), area, groupBy),
    [shown, groupBy, ctx.assetKey, area]
  );

  const tiles = useMemo<TileView[]>(() => {
    const iconIds = new Set(
      [...layout.tiles]
        .filter((c) => c.width >= ICON_MIN && c.height >= ICON_MIN && c.item.kind !== "xch")
        .sort((a, b) => b.width * b.height - a.width * a.height)
        .slice(0, MAX_ICONS)
        .map((c) => c.id)
    );
    return layout.tiles.map((cell) => {
      const item = cell.item;
      const yours = ctx.isYours(item);
      const launcher = item.kind === "nft" ? item.assetIds[0] : undefined;
      const big = cell.width >= IMAGE_MIN && cell.height >= IMAGE_MIN;
      const values = {
        id: shortId(item.id),
        kind: t(`kinds.${item.kind}`),
        amount: assetLines(item.assets, item.kind, ctx.ticker)[0] ?? "",
        cost: formatCost(item.cost),
        rate: formatFeeRate(item.feeRate),
      };
      return {
        id: item.id,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height,
        colour: tileColour(colour, item.kind, item.feeRate),
        dim: matched !== null && !matched.has(item.id),
        fresh: ctx.isFresh(item),
        yours,
        label: t(yours ? "cellLabelYours" : "cellLabel", values),
        kind: item.kind,
        assetId: item.assetIds[0],
        image: launcher && big && iconIds.has(item.id) ? ctx.nftImage(launcher) : null,
        icon: iconIds.has(item.id),
        sensitivity: launcher ? ctx.nftVerdict(launcher) : null,
      };
    });
  }, [layout, colour, matched, ctx, t]);

  const frames = useMemo<FrameView[]>(
    () => layout.frames.map((f) => ({ ...f, label: ctx.groupLabel(f.key) })),
    [layout, ctx]
  );

  // A confirmed block: the transaction height moved on and bundles of this block are gone.
  const [departure, setDeparture] = useState<{ key: number; label: string } | null>(null);
  const seen = useRef<{ ids: Set<string>; height: number | null } | null>(null);
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    const before = seen.current;
    seen.current = { ids, height: txHeight };
    if (before && txHeight !== null && detectDeparture(before.ids, ids, before.height, txHeight))
      setDeparture((d) => ({
        key: (d?.key ?? 0) + 1,
        label: t("departed", { height: formatInteger(txHeight) }),
      }));
  }, [items, txHeight, t]);

  /* ---------------------------------------------------------------- tooltip and focus */
  const [tip, setTip] = useState<Tip | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef<string>("mouse");
  const active = useRef<string | null>(null);
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const tileIds = useMemo(() => new Set(tiles.map((x) => x.id)), [tiles]);
  const activeId =
    active.current && tileIds.has(active.current) ? active.current : (tiles[0]?.id ?? null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);
  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(
      () => setTip((current) => (current?.pinned ? current : null)),
      HIDE_DELAY_MS
    );
  }, [cancelHide]);
  useEffect(() => cancelHide, [cancelHide]);

  const tileOf = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? (target.closest("[data-tile]") as HTMLElement | null) : null;
  const anchor =
    tip && wrapper.current
      ? wrapper.current.querySelector<HTMLElement>(`[data-tile][data-id="${tip.id}"]`)
      : null;
  const tipItem = tip ? itemById.get(tip.id) : undefined;

  // The bundle left (or was filtered out of view): close its tooltip.
  useEffect(() => {
    if (tip && !tileIds.has(tip.id)) setTip(null);
  }, [tip, tileIds]);

  // A pinned tooltip closes on a tap anywhere else.
  useEffect(() => {
    if (!tip?.pinned) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest?.("[data-floating='goggles-tip']") || tileOf(target)) return;
      setTip(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [tip?.pinned]);

  // Point the tile at its description while the tooltip is open.
  useEffect(() => {
    if (!anchor) return;
    anchor.setAttribute("aria-describedby", "goggles-tip");
    return () => anchor.removeAttribute("aria-describedby");
  }, [anchor]);

  const focusTile = (id: string) => {
    const root = wrapper.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-tile][tabindex='0']").forEach((el) => {
      el.tabIndex = -1;
    });
    const el = root.querySelector<HTMLElement>(`[data-tile][data-id="${id}"]`);
    if (!el) return;
    el.tabIndex = 0;
    active.current = id;
    el.focus();
  };

  const handlers = {
    onPointerOver: (e: React.PointerEvent) => {
      lastPointer.current = e.pointerType;
      if (e.pointerType === "touch") return;
      const tile = tileOf(e.target);
      if (!tile?.dataset.id) return;
      cancelHide();
      const id = tile.dataset.id;
      setTip((current) => (current?.id === id ? current : { id, pinned: false }));
    },
    onPointerOut: (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (tileOf(e.relatedTarget) === tileOf(e.target)) return;
      scheduleHide();
    },
    onPointerDown: (e: React.PointerEvent) => {
      lastPointer.current = e.pointerType;
    },
    // Capture phase: the tile link navigates in its own click handler, which runs first.
    onClickCapture: (e: React.MouseEvent) => {
      const tile = tileOf(e.target);
      const id = tile?.dataset.id;
      if (!id) return;
      // Touch: the first tap shows the details, a second tap on the same tile opens it.
      if (lastPointer.current === "touch" && !(tip?.pinned && tip.id === id)) {
        e.preventDefault();
        cancelHide();
        active.current = id;
        setTip({ id, pinned: true });
      }
    },
    onFocus: (e: React.FocusEvent) => {
      const id = tileOf(e.target)?.dataset.id;
      if (!id) return;
      cancelHide();
      active.current = id;
      setTip((current) => (current?.id === id ? current : { id, pinned: false }));
    },
    onBlur: (e: React.FocusEvent) => {
      const next = e.relatedTarget as Element | null;
      if (next?.closest?.("[data-floating='goggles-tip']") || tileOf(next)) return;
      scheduleHide();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      const id = tileOf(e.target)?.dataset.id;
      if (!id) return;
      if (e.key === "Escape") {
        setTip(null);
        return;
      }
      const direction = KEY_DIRECTIONS[e.key];
      let target: string | null = null;
      if (direction) target = neighbourTile(tiles, id, direction);
      else if (e.key === "Home") target = tiles[0]?.id ?? null;
      else if (e.key === "End") target = tiles[tiles.length - 1]?.id ?? null;
      else return;
      e.preventDefault();
      if (target) focusTile(target);
    },
  };

  const fillTop = area.y;
  const noMatch = matched !== null && matched.size === 0;
  const fillShare = blockMaxCost > 0 ? Math.min(1, shownCost / blockMaxCost) : 0;
  const side = width;

  return (
    <div ref={column} className="w-full min-w-0">
      <div
        className="goggles-block relative mx-auto"
        style={{ width: side + BLOCK_DEPTH, height: side + BLOCK_DEPTH }}
      >
        {side > 0 ? (
          <>
            <div
              aria-hidden="true"
              className="goggles-face-top absolute left-0 top-0"
              style={{ width: side, height: BLOCK_DEPTH }}
            />
            <div
              aria-hidden="true"
              className="goggles-face-side absolute"
              style={{ left: side, top: BLOCK_DEPTH, width: BLOCK_DEPTH, height: side }}
            />
          </>
        ) : null}
        <div
          ref={wrapper}
          className={cn(
            "goggles-canvas goggles-face absolute left-0",
            !visible && "goggles-paused"
          )}
          style={{ top: BLOCK_DEPTH, width: side, height: side }}
        >
          {side > 0 ? (
            <>
              <div
                aria-hidden="true"
                className="goggles-capacity absolute inset-x-0 top-0"
                style={{ height: Math.max(0, fillTop) }}
              />
              {SCALE.map((q) => {
                const y = Math.round(side * (1 - q));
                return (
                  <div
                    key={q}
                    aria-hidden="true"
                    className="goggles-rule absolute inset-x-0"
                    style={{ top: y }}
                  >
                    {y < fillTop - 14 ? (
                      <span className="goggles-rule-label">{formatPercent(q)}</span>
                    ) : null}
                  </div>
                );
              })}
              <div
                role="group"
                aria-label={label}
                aria-describedby="goggles-keys"
                className="absolute inset-0"
                {...handlers}
              >
                <GogglesTiles
                  tiles={tiles}
                  frames={frames}
                  activeId={activeId}
                  departure={departure}
                  canvasWidth={side}
                  canvasHeight={side}
                />
              </div>
              <div
                aria-hidden="true"
                className="goggles-fill-line absolute inset-x-0 top-0"
                style={{ transform: `translateY(${fillTop}px)` }}
              >
                <span className="goggles-fill-label">{formatPercent(fillShare)}</span>
              </div>
              <p id="goggles-keys" className="sr-only">
                {t("keysHint")}
              </p>
              {noMatch ? (
                <div
                  data-testid="goggles-empty"
                  className="absolute inset-0 flex items-center justify-center bg-surface/85 p-4 text-center"
                >
                  {emptyState}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {tip && anchor && tipItem ? (
        <TileTooltip
          id="goggles-tip"
          anchor={anchor}
          item={tipItem}
          blockCost={blockCost}
          now={Date.now()}
          yours={ctx.isYours(tipItem)}
          fresh={ctx.isFresh(tipItem)}
          ticker={ctx.ticker}
          nftName={
            tipItem.kind === "nft" && tipItem.assetIds[0] ? ctx.nftName(tipItem.assetIds[0]) : null
          }
          collectionName={
            tipItem.kind === "nft" && tipItem.assetIds[0]
              ? ctx.collectionName(tipItem.assetIds[0])
              : null
          }
          sensitivity={
            tipItem.kind === "nft" && tipItem.assetIds[0]
              ? ctx.nftVerdict(tipItem.assetIds[0])
              : null
          }
          onPointerEnter={cancelHide}
          onPointerLeave={scheduleHide}
        />
      ) : null}
    </div>
  );
}
