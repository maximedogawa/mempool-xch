"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useProjectedBlocks, useRecentBlocks } from "@/shared/api/hooks";
import { useWatchedActivity } from "@/widgets/watchlist/useWatchedActivity";
import { CHIA } from "@/shared/config/networks";
import { useT } from "@/shared/i18n/useT";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { ProjectedBlockDetails } from "./ProjectedBlockDetails";
import { ProjectedBlocks } from "./ProjectedBlocks";
import { RecentBlocks } from "./RecentBlocks";
import blocksNs from "@/shared/i18n/messages/en/blocks";

/**
 * The signature mempool.space row: projected blocks left of a dotted divider, confirmed blocks
 * right of it, in ONE horizontal scroller with the scrollbar hidden. It opens with the divider
 * in view (next block and newest block side by side) and can be dragged with the pointer.
 */
export function BlocksRow() {
  const t = useT(blocksNs);
  const { settings } = useSettings();
  const watched = useWatchedActivity();
  const projected = useProjectedBlocks(8);
  const recent = useRecentBlocks(settings.recentBlocks);
  const [selected, setSelected] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const divider = useRef<HTMLDivElement>(null);
  const userScrolled = useRef(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const selectedBlock =
    selected !== null ? projected.blocks.find((b) => b.index === selected) : undefined;
  const blockMaxCost = projected.summary?.state.blockMaxCost ?? CHIA.BLOCK_MAX_COST;
  const ready = projected.blocks.length > 0 || !!recent.data;

  // Keep the divider anchored (next block and newest block side by side) while the row is
  // still settling; stop as soon as the visitor scrolls or drags it themselves.
  const projectedCount = projected.blocks.length;
  const confirmedCount = recent.data?.txBlocks.length ?? 0;
  useEffect(() => {
    if (userScrolled.current || !ready || !scroller.current || !divider.current) return;
    const el = scroller.current;
    const share = el.clientWidth < 640 ? 0.42 : 0.46;
    const target = Math.max(0, divider.current.offsetLeft - el.clientWidth * share);
    el.scrollLeft = target;
    // Layout can still shift when cubes animate in; re-anchor once more on the next frame.
    const id = requestAnimationFrame(() => {
      if (!userScrolled.current && scroller.current && divider.current) {
        scroller.current.scrollLeft = Math.max(
          0,
          divider.current.offsetLeft - scroller.current.clientWidth * share
        );
      }
    });
    return () => cancelAnimationFrame(id);
  }, [ready, projectedCount, confirmedCount]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    userScrolled.current = true;
    if (e.pointerType !== "mouse" || !scroller.current) return;
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || !scroller.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    scroller.current.scrollLeft = drag.current.left - dx;
  };
  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.moved) e.preventDefault();
    drag.current = null;
  };

  return (
    <section
      aria-label={t("row.label")}
      className="rounded-card border border-border/60 bg-(image:--strip-bg)"
    >
      <div
        ref={scroller}
        className="scrollbar-none cursor-grab overflow-x-auto overscroll-x-contain px-4 pb-4 pt-4 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onWheel={() => {
          userScrolled.current = true;
        }}
        onTouchStart={() => {
          userScrolled.current = true;
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => {
          if (drag.current?.moved) e.stopPropagation();
        }}
      >
        <div className="flex min-w-max items-end gap-4">
          <div className="flex flex-col items-end gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
              {t("row.projected")}
            </span>
            <ProjectedBlocks
              watchedIds={watched.pendingIds}
              blocks={projected.blocks}
              loading={projected.isLoading}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
          <div
            ref={divider}
            aria-hidden="true"
            className="relative mb-7 h-[196px] w-0 self-end border-l-2 border-dashed border-fg-faint/70"
          >
            <span className="absolute -left-[7px] -top-4 text-[11px] text-fg-faint">⇅</span>
            <span className="absolute -bottom-4 -left-[7px] text-[11px] text-fg-faint">⇄</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
              {t("row.confirmed")}
            </span>
            <RecentBlocks
              watchedConfirmed={watched.confirmed}
              data={recent.data}
              loading={recent.isLoading}
              blockMaxCost={blockMaxCost}
            />
          </div>
        </div>
      </div>
      {selectedBlock ? (
        <div className="px-4 pb-4">
          <ProjectedBlockDetails block={selectedBlock} onClose={() => setSelected(null)} />
        </div>
      ) : null}
    </section>
  );
}
