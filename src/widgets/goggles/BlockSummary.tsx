"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatCost, formatFeeRate, formatPercent } from "@/shared/lib/chia/amounts";
import { formatEta } from "@/shared/lib/format/time";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { useT } from "@/shared/i18n/useT";
import { formatShare, formatXchUnits } from "./format";
import { FLOATING_CLASS, Floating } from "./GogglesTooltip";
import type { KindShare } from "./model";
import { KIND_COLOR } from "./palette";

const HIDE_DELAY_MS = 120;

/**
 * Fill level and headline numbers of the projected next block. Hovering, focusing or tapping it
 * opens a card with the block as a whole: bundles, cost and fill, fees, fee-rate range and
 * median, asset mix and the time to the next transaction block.
 */
export function BlockSummary({
  block,
  blockMaxCost,
  mix,
  freshCount,
  freshSeconds,
}: {
  block: ProjectedBlock;
  blockMaxCost: number;
  mix: KindShare[];
  freshCount: number;
  freshSeconds: number;
}) {
  const t = useT("goggles");
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointer = useRef("mouse");
  // A press focuses the button before its click: let the click decide, or a tap would open
  // (focus) and close (click) the card at once.
  const pressing = useRef(false);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const hideSoon = () => {
    cancel();
    timer.current = setTimeout(() => setOpen(false), HIDE_DELAY_MS);
  };
  useEffect(() => cancel, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!button.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const strong = (c: ReactNode) => <span className="tabular font-semibold text-fg">{c}</span>;
  const fillTone =
    block.fill > 0.9 ? "var(--fee-5)" : block.fill > 0.6 ? "var(--fee-3)" : "var(--primary)";

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? "goggles-block-card" : undefined}
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType;
          pressing.current = true;
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "touch") return;
          cancel();
          setOpen(true);
        }}
        onPointerLeave={(e) => e.pointerType !== "touch" && hideSoon()}
        onFocus={() => !pressing.current && setOpen(true)}
        onBlur={() => {
          pressing.current = false;
          hideSoon();
        }}
        onClick={() => {
          pressing.current = false;
          if (lastPointer.current === "touch") setOpen((o) => !o);
          else setOpen(true);
        }}
        className="-mx-1 flex w-[calc(100%+0.5rem)] flex-wrap items-end justify-between gap-x-4 gap-y-1 rounded-sm px-1 py-0.5 text-left hover:bg-surface-2/60"
      >
        <span className="sr-only">{t("blockDetails")}</span>
        <span className="flex items-baseline gap-2">
          <span
            className="tabular text-2xl font-semibold leading-none transition-colors"
            style={{ color: fillTone }}
            data-testid="goggles-fill"
          >
            {formatPercent(block.fill)}
          </span>
          <span className="text-xs text-fg-muted">
            {t("fullOf", { cost: formatCost(block.totalCost), max: formatCost(blockMaxCost) })}
          </span>
        </span>
        <span className="flex flex-wrap items-baseline gap-x-3 text-xs text-fg-muted">
          <span>{t.rich("bundles", { count: block.items.length, b: strong })}</span>
          <span>{t.rich("fees", { amount: formatXchUnits(block.totalFee), b: strong })}</span>
          {freshCount > 0 ? (
            <span className="text-primary">
              {t.rich("fresh", {
                count: freshCount,
                seconds: freshSeconds,
                b: (c) => <span className="tabular font-semibold">{c}</span>,
              })}
            </span>
          ) : null}
        </span>
      </button>
      {open && button.current ? (
        <Floating
          anchor={button.current}
          id="goggles-block-card"
          role="tooltip"
          onPointerEnter={cancel}
          onPointerLeave={hideSoon}
          className={FLOATING_CLASS}
        >
          <div data-testid="goggles-block-card" className="flex flex-col gap-2">
            <div className="text-sm font-semibold text-fg">{t("card.title")}</div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
              <dt className="text-fg-faint">{t("card.bundles")}</dt>
              <dd className="tabular text-fg">{block.items.length}</dd>
              <dt className="text-fg-faint">{t("card.cost")}</dt>
              <dd className="tabular text-fg">
                {t("card.costValue", {
                  cost: formatCost(block.totalCost),
                  max: formatCost(blockMaxCost),
                  percent: formatPercent(block.fill),
                })}
              </dd>
              <dt className="text-fg-faint">{t("card.fees")}</dt>
              <dd className="tabular text-fg">{formatXchUnits(block.totalFee)}</dd>
              <dt className="text-fg-faint">{t("card.feeRate")}</dt>
              <dd className="tabular text-fg">
                {t("card.feeRateValue", {
                  min: formatFeeRate(block.minFeeRate),
                  max: formatFeeRate(block.maxFeeRate),
                  median: formatFeeRate(block.medianFeeRate),
                })}
              </dd>
              <dt className="text-fg-faint">{t("card.eta")}</dt>
              <dd className="tabular text-fg">{formatEta(block.etaSeconds)}</dd>
            </dl>
            <div>
              <div className="mb-1 text-fg-faint">{t("card.mix")}</div>
              <div aria-hidden="true" className="mb-1.5 flex h-1.5 overflow-hidden rounded-full">
                {mix.map((m) => (
                  <span
                    key={m.kind}
                    style={{ width: `${m.share * 100}%`, background: KIND_COLOR[m.kind] }}
                  />
                ))}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                {mix.map((m) => (
                  <li key={m.kind} className="inline-flex items-center gap-1 text-fg">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: KIND_COLOR[m.kind] }}
                    />
                    {t("card.mixEntry", {
                      kind: t(`kinds.${m.kind}`),
                      count: m.count,
                      share: formatShare(m.share),
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Floating>
      ) : null}
    </>
  );
}
