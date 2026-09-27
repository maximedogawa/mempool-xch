"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useProjectedBlocks, useRecentBlocks } from "@/shared/api/hooks";
import { useWatchedActivity } from "@/widgets/watchlist/useWatchedActivity";
import { CHIA } from "@/shared/config/networks";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { ProjectedBlockDetails } from "./ProjectedBlockDetails";
import { ProjectedBlocks } from "./ProjectedBlocks";
import { RecentBlocks } from "./RecentBlocks";
import blocksNs from "@/shared/i18n/messages/en/blocks";

/** How far (px) the row may be scrolled before an edge counts as having more blocks behind it. */
const EDGE = 2;
/** Below this row width "now" is the next block rather than the inflection point. */
const NARROW = 640;

interface ScrollState {
  /** Blocks hidden beyond the left or right edge. */
  before: boolean;
  after: boolean;
  /** Where the inflection point is: in view, or off to one side. */
  now: "in" | "left" | "right";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The inflection point: where the mempool becomes chain. A full-height double hairline with
 * ruler ticks, a "now" node at cube height and a rail stop where the queue's flow line arrives.
 * The "now" label is a button that brings the inflection point back to the middle of the row.
 */
const Inflection = forwardRef<
  HTMLDivElement,
  { label: string; actionLabel: string; onNow: () => void }
>(function Inflection({ label, actionLabel, onNow }, ref) {
  return (
    <div ref={ref} className="blocks-inflection blocks-snap">
      <span aria-hidden="true" className="blocks-inflection-band" />
      <span aria-hidden="true" className="blocks-inflection-line" />
      <span aria-hidden="true" className="blocks-inflection-ticks" />
      <span className="blocks-inflection-node">
        <button
          type="button"
          onClick={onNow}
          aria-label={actionLabel}
          data-testid="blocks-now"
          className="blocks-inflection-now"
        >
          {label}
        </button>
      </span>
      <span aria-hidden="true" className="blocks-inflection-stop" />
    </div>
  );
});

/**
 * The block row: projected blocks queue up left of the inflection point, confirmed blocks run
 * right of it, in ONE horizontal scroller with the scrollbar hidden. Blocks and the inflection
 * point snap to the centre (proximity, so free scrolling still works); the row opens with "now"
 * centred (the inflection point on a wide screen, the next block on a phone), fades its edges
 * while more blocks lie beyond them, offers a way back to now once it leaves the view, and can
 * be dragged with the mouse.
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
  /** The projected blocks themselves (without the queue's leading space). */
  const queue = useRef<HTMLDivElement>(null);
  /** Leading space before the queue, so the inflection point can reach the middle of the row
   *  even when few blocks are projected; it shows the ruled queue zone fading out. */
  const [lead, setLead] = useState(0);
  /** The confirmed blocks, and the matching trailing space when there are only a few. */
  const chain = useRef<HTMLDivElement>(null);
  const [tail, setTail] = useState(0);
  const userScrolled = useRef(false);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  /** Swallows the click that ends a drag, so releasing over a block does not open it. */
  const clickGuard = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [scroll, setScroll] = useState<ScrollState>({ before: false, after: false, now: "in" });
  const selectedBlock =
    selected !== null ? projected.blocks.find((b) => b.index === selected) : undefined;
  const blockMaxCost = projected.summary?.state.blockMaxCost ?? CHIA.BLOCK_MAX_COST;
  const ready = projected.blocks.length > 0 || !!recent.data;

  /**
   * What "now" means for the row: on a phone (a row narrower than NARROW) the next block, which
   * is all one can take in at that width; on a wider screen the inflection point, with the next
   * block on its left and the newest block on its right.
   */
  const focus = useCallback((): HTMLElement | null => {
    const el = scroller.current;
    if (!el) return null;
    if (el.clientWidth < NARROW) {
      const next = queue.current?.querySelector<HTMLElement>("li");
      if (next) return next;
    }
    return divider.current;
  }, []);

  /** scrollLeft that puts the focus in the middle of the row. */
  const nowTarget = useCallback((): number | null => {
    const el = scroller.current;
    const target = focus();
    if (!el || !target) return null;
    const row = el.getBoundingClientRect();
    const mark = target.getBoundingClientRect();
    return Math.max(0, el.scrollLeft + mark.left + mark.width / 2 - (row.left + row.width / 2));
  }, [focus]);

  const measure = useCallback(() => {
    const el = scroller.current;
    const d = divider.current;
    const target = focus();
    if (!el || !d || !target) return;
    const narrow = el.clientWidth < NARROW;
    const listWidth = queue.current?.getBoundingClientRect().width ?? 0;
    const nextWidth = queue.current?.querySelector("li")?.getBoundingClientRect().width ?? 0;
    // Row padding (16) + gap to the inflection point (8) + half its width.
    const half = d.getBoundingClientRect().width / 2;
    // Leading space so the focus can reach the middle: the next block needs half the row left
    // of its centre, the inflection point half the row left of its own.
    const nextLead = Math.max(
      0,
      Math.round(
        narrow
          ? el.clientWidth / 2 + nextWidth / 2 - listWidth - 16
          : el.clientWidth / 2 - listWidth - 16 - 8 - half
      )
    );
    setLead((current) => (Math.abs(current - nextLead) > 1 ? nextLead : current));
    const chainWidth = chain.current?.getBoundingClientRect().width ?? 0;
    const nextTail = narrow
      ? 0
      : Math.max(0, Math.round(el.clientWidth / 2 - chainWidth - 16 - 8 - half));
    setTail((current) => (Math.abs(current - nextTail) > 1 ? nextTail : current));
    const row = el.getBoundingClientRect();
    const mark = target.getBoundingClientRect();
    const centre = mark.left + mark.width / 2;
    const next: ScrollState = {
      before: el.scrollLeft > EDGE,
      after: el.scrollLeft < el.scrollWidth - el.clientWidth - EDGE,
      now: centre < row.left ? "left" : centre > row.right ? "right" : "in",
    };
    setScroll((s) =>
      s.before === next.before && s.after === next.after && s.now === next.now ? s : next
    );
  }, [focus]);

  // Keep the focus centred while the row is still settling; stop as soon as the
  // visitor scrolls or drags it themselves.
  const projectedCount = projected.blocks.length;
  const confirmedCount = recent.data?.txBlocks.length ?? 0;
  useEffect(() => {
    if (userScrolled.current || !ready) return;
    const anchor = () => {
      const target = nowTarget();
      if (target !== null && scroller.current && !userScrolled.current)
        scroller.current.scrollLeft = target;
      measure();
    };
    anchor();
    // Layout can still shift when cubes animate in; re-anchor once more on the next frame.
    const id = requestAnimationFrame(anchor);
    return () => cancelAnimationFrame(id);
  }, [ready, projectedCount, confirmedCount, lead, tail, nowTarget, measure]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(onScroll) : null;
    observer?.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [measure]);

  const backToNow = () => {
    userScrolled.current = true;
    const target = nowTarget();
    if (target === null || !scroller.current) return;
    scroller.current.scrollTo({
      left: target,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  // A mouse drag moves scrollLeft by hand, which snapping would fight: it is off while the
  // button is held and back on release, when the browser settles on the nearest block.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    userScrolled.current = true;
    if (e.pointerType !== "mouse" || e.button !== 0 || !scroller.current) return;
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || !scroller.current) return;
    const dx = e.clientX - drag.current.x;
    if (!drag.current.moved && Math.abs(dx) > 3) {
      drag.current.moved = true;
      setDragging(true);
    }
    if (drag.current.moved) scroller.current.scrollLeft = drag.current.left - dx;
  };
  const endDrag = () => {
    if (!drag.current) return;
    const moved = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (!moved) return;
    clickGuard.current = true;
    setTimeout(() => {
      clickGuard.current = false;
    }, 0);
  };

  return (
    <section
      aria-label={t("row.label")}
      className="relative rounded-card border border-border bg-(image:--strip-bg)"
    >
      <div
        ref={scroller}
        data-testid="blocks-scroller"
        data-dragging={dragging ? "" : undefined}
        data-fade-before={scroll.before ? "" : undefined}
        data-fade-after={scroll.after ? "" : undefined}
        className="blocks-scroller scrollbar-none cursor-grab overflow-x-auto overscroll-x-contain px-4 pb-4 pt-4 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onWheel={() => {
          userScrolled.current = true;
        }}
        onTouchStart={() => {
          userScrolled.current = true;
        }}
        onKeyDown={() => {
          userScrolled.current = true;
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (clickGuard.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <div className="flex min-w-max items-stretch gap-2">
          <div className="blocks-queue flex flex-col items-end gap-2" style={{ paddingLeft: lead }}>
            <span aria-hidden="true" className="blocks-queue-zone" />
            <span aria-hidden="true" className="blocks-flow" />
            <span className="eyebrow relative text-[11px] text-fg-faint">{t("row.projected")}</span>
            <div ref={queue} className="relative mt-auto">
              <ProjectedBlocks
                watchedIds={watched.pendingIds}
                blocks={projected.blocks}
                loading={projected.isLoading}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          </div>
          <Inflection
            ref={divider}
            label={t("row.now")}
            actionLabel={t("row.backToNowLabel")}
            onNow={backToNow}
          />
          <div className="flex flex-col gap-2" style={{ paddingRight: tail }}>
            <span className="eyebrow text-[11px] text-fg-faint">{t("row.confirmed")}</span>
            <div ref={chain} className="mt-auto">
              <RecentBlocks
                watchedConfirmed={watched.confirmed}
                data={recent.data}
                // isPending, not isLoading: the query waits for the peak, and a query that has
                // not started yet is not "loading", which showed the empty message instead.
                loading={recent.isPending}
                blockMaxCost={blockMaxCost}
              />
            </div>
          </div>
        </div>
      </div>
      {scroll.now !== "in" ? (
        <button
          type="button"
          onClick={backToNow}
          aria-label={t("row.backToNowLabel")}
          data-testid="blocks-back-to-now"
          className={cn(
            "seg absolute top-3 z-10 rounded-full shadow-card",
            scroll.now === "left" ? "left-3" : "right-3"
          )}
        >
          {scroll.now === "left" ? <ChevronLeft size={14} aria-hidden="true" /> : null}
          {t("row.backToNow")}
          {scroll.now === "right" ? <ChevronRight size={14} aria-hidden="true" /> : null}
        </button>
      ) : null}
      {selectedBlock ? (
        <div className="px-4 pb-4">
          <ProjectedBlockDetails block={selectedBlock} onClose={() => setSelected(null)} />
        </div>
      ) : null}
    </section>
  );
}
