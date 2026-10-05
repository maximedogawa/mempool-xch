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
import gogglesNs from "@/shared/i18n/messages/en/goggles";

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
  const t = useT(gogglesNs);
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
  // Colour only when the block is congested; the numeral is ink otherwise.
  const fillTone = block.fill > 0.9 ? "var(--warning)" : "var(--fg)";

  return (
    <div className="flex min-w-0 flex-col gap-2.5">
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
        className="-mx-2 flex flex-col items-start gap-1 rounded-sm px-2 py-0.5 text-left transition-colors hover:bg-surface-2/60"
      >
        <span className="sr-only">{t("blockDetails")}</span>
        <span
          className="tabular text-4xl font-extrabold leading-none tracking-[-0.04em]"
          style={{ color: fillTone }}
          data-testid="goggles-fill"
        >
          {formatPercent(block.fill)}
        </span>
        <span className="text-xs text-fg-muted">
          {t("fullOf", { cost: formatCost(block.totalCost), max: formatCost(blockMaxCost) })}
        </span>
      </button>
      {/* The facts as one ruled row beside the numeral on a wide screen, stacked on a phone. */}
      <dl className="grid grid-cols-1 border-y border-rule text-xs sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-0.5 py-1.5 sm:pr-4">
          <dt className="eyebrow text-[10px] text-fg-faint">{t("card.bundles")}</dt>
          <dd className="flex flex-wrap items-baseline gap-x-3 text-fg-muted">
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
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 border-t border-rule py-1.5 sm:border-l sm:border-t-0 sm:px-4">
          <dt className="eyebrow text-[10px] text-fg-faint">{t("card.feeRate")}</dt>
          <dd className="tabular text-fg">
            {t("card.feeRateValue", {
              min: formatFeeRate(block.minFeeRate),
              max: formatFeeRate(block.maxFeeRate),
              median: formatFeeRate(block.medianFeeRate),
            })}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 border-t border-rule py-1.5 sm:border-l sm:border-t-0 sm:pl-4">
          <dt className="eyebrow text-[10px] text-fg-faint">{t("card.eta")}</dt>
          <dd className="tabular text-fg">{formatEta(block.etaSeconds)}</dd>
        </div>
      </dl>
      {mix.length > 0 ? (
        <div aria-hidden="true" className="flex h-2 overflow-hidden rounded-sm bg-surface-2">
          {mix.map((m) => (
            <span
              key={m.kind}
              className="h-full transition-[width] duration-200 ease-out"
              style={{ width: `${m.share * 100}%`, background: KIND_COLOR[m.kind] }}
            />
          ))}
        </div>
      ) : null}
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
    </div>
  );
}
