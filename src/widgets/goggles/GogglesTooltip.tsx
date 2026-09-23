"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { formatDuration } from "@/shared/lib/format/time";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { routes } from "@/shared/lib/routes";
import { useT } from "@/shared/i18n/useT";
import { AssetIcon } from "@/shared/ui";
import type { Sensitivity } from "@/shared/lib/nft/sensitivity";
import { assetLines, formatShare, formatXchUnits } from "./format";
import gogglesNs from "@/shared/i18n/messages/en/goggles";

const MARGIN = 8;
const GAP = 8;

/**
 * Keeps a floating box next to an anchor and inside the viewport: above the anchor when it
 * fits, otherwise below, clamped to the edges. Rendered into document.body (position: fixed)
 * so no transformed ancestor (the lifting card) can offset it.
 */
export function Floating({
  anchor,
  id,
  role,
  label,
  children,
  onPointerEnter,
  onPointerLeave,
  className,
}: {
  anchor: HTMLElement;
  id: string;
  role?: string;
  label?: string;
  children: ReactNode;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const place = () => {
      const el = box.current;
      if (!el || !anchor.isConnected) return;
      const a = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      let top = a.top - h - GAP;
      if (top < MARGIN) top = a.bottom + GAP;
      if (top + h > vh - MARGIN) top = Math.max(MARGIN, vh - h - MARGIN);
      const left = Math.min(
        Math.max(MARGIN, a.left + a.width / 2 - w / 2),
        Math.max(MARGIN, vw - w - MARGIN)
      );
      setPos({ left: Math.round(left), top: Math.round(top) });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [anchor, children]);

  return createPortal(
    <div
      ref={box}
      id={id}
      data-floating={id}
      role={role}
      aria-label={label}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={className}
      style={{
        position: "fixed",
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        visibility: pos ? "visible" : "hidden",
        maxWidth: `min(320px, calc(100vw - ${MARGIN * 2}px))`,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

export const FLOATING_CLASS =
  "z-50 rounded-card border border-border-strong bg-bg-elevated px-3 py-2.5 text-xs shadow-card";

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-faint">{term}</dt>
      <dd className="tabular min-w-0 break-words text-fg">{children}</dd>
    </>
  );
}

/** Details of one bundle, anchored to its tile (hover, focus or tap). */
export function TileTooltip({
  id,
  anchor,
  item,
  blockCost,
  now,
  yours,
  fresh,
  ticker,
  nftName,
  collectionName,
  sensitivity,
  onPointerEnter,
  onPointerLeave,
}: {
  id: string;
  anchor: HTMLElement;
  item: CompactMempoolItem;
  blockCost: number;
  now: number;
  yours: boolean;
  fresh: boolean;
  ticker: (assetId: string) => string | undefined;
  nftName: string | null;
  collectionName: string | null;
  sensitivity: Sensitivity | null;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  const t = useT(gogglesNs);
  const [primary, ...rest] = assetLines(item.assets, item.kind, ticker);
  return (
    <Floating
      anchor={anchor}
      id={id}
      role="tooltip"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className={FLOATING_CLASS}
    >
      <div data-testid="goggles-tooltip" className="flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <AssetIcon
            kind={item.kind}
            assetId={item.assetIds[0]}
            size={18}
            sensitivity={sensitivity}
          />
          <div className="min-w-0 flex-1">
            <div className="break-words text-sm font-semibold text-fg">{primary}</div>
            {rest.length > 0 ? <div className="text-fg-muted">{rest.join(" · ")}</div> : null}
            {nftName || collectionName ? (
              <div className="truncate text-fg-muted">
                {[nftName, collectionName].filter(Boolean).join(" · ")}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {yours ? (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold uppercase text-[#0a0d18]">
                {t("yoursChip")}
              </span>
            ) : null}
            {fresh ? (
              <span className="rounded-full border border-fg-muted px-1.5 text-[10px] font-semibold text-fg">
                {t("newChip")}
              </span>
            ) : null}
          </div>
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
          <Row term={t("tip.bundle")}>
            <span className="mono">{shortId(item.id, 10, 6)}</span>
          </Row>
          <Row term={t("tip.kind")}>{t(`kinds.${item.kind}`)}</Row>
          <Row term={t("tip.fee")}>{formatXchUnits(BigInt(item.fee))}</Row>
          <Row term={t("tip.feeRate")}>
            {t("tip.feeRateValue", { rate: formatFeeRate(item.feeRate) })}
          </Row>
          <Row term={t("tip.cost")}>
            {t("tip.costValue", {
              cost: formatCost(item.cost),
              share: formatShare(blockCost > 0 ? item.cost / blockCost : 0),
            })}
          </Row>
          <Row term={t("tip.spends")}>{item.spends}</Row>
          <Row term={t("tip.age")}>{formatDuration((now - item.firstSeen) / 1000)}</Row>
        </dl>
        <Link
          href={routes.tx(item.id)}
          prefetch={false}
          className="inline-flex min-h-8 items-center justify-center rounded-full border border-border px-3 font-semibold text-primary hover:border-primary"
        >
          {t("tip.open")}
        </Link>
      </div>
    </Floating>
  );
}
