"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { useT } from "@/shared/i18n/useT";
import { ageBucketMinutes, formatShare, parseRateInput, sizeBucketBounds } from "./format";
import {
  activeChips,
  AGE_BUCKETS,
  chipKey,
  EMPTY_FILTERS,
  SIZE_BUCKETS,
  toggle,
  TX_KINDS,
  withoutChip,
  type AgeBucketId,
  type AssetOption,
  type FilterChip,
  type GogglesFilters,
  type GogglesPrefs,
  type GroupBy,
  type MatchSummary,
  type SizeBucketId,
} from "./model";
import { KIND_COLOR } from "./palette";
import gogglesNs from "@/shared/i18n/messages/en/goggles";

/** Asset options listed in the panel; the search box finds the rest by name. */
const MAX_ASSET_OPTIONS = 16;

export function Chip({
  active,
  onClick,
  swatch,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  swatch?: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex min-h-7 max-w-full items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition-colors",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
      )}
    >
      {swatch ? (
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ background: swatch }}
        />
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="tabular font-normal text-fg-muted">{n}</span>;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

/** Fee-rate input that keeps what the visitor typed until it parses. */
function RateInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? "" : String(value));
  useEffect(() => {
    // A chip removed elsewhere clears the field; typing "0." must not be rewritten to "0".
    setText((current) =>
      parseRateInput(current) === value ? current : value === null ? "" : String(value)
    );
  }, [value]);
  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseRateInput(e.target.value));
      }}
      className="h-7 w-20 rounded-full border border-border bg-bg px-2.5 text-[11px] text-fg placeholder:text-fg-faint focus:border-primary"
    />
  );
}

export interface FilterBarProps {
  prefs: GogglesPrefs;
  onChange: (update: (prefs: GogglesPrefs) => GogglesPrefs) => void;
  kindCounts: Partial<Record<TxKindHint, number>>;
  assets: AssetOption[];
  assetName: (key: string) => string;
  freshCount: number;
  yoursCount: number;
  total: number;
  summary: MatchSummary | null;
}

/**
 * Search, filters and view options. Within a filter several values are alternatives, different
 * filters combine; every active value shows as a removable chip. The state is persisted by the
 * parent (useGogglesPrefs).
 */
export function GogglesFilterBar({
  prefs,
  onChange,
  kindCounts,
  assets,
  assetName,
  freshCount,
  yoursCount,
  total,
  summary,
}: FilterBarProps) {
  const t = useT(gogglesNs);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const filters = prefs.filters;
  const chips = activeChips(filters);
  const setFilters = (update: (f: GogglesFilters) => GogglesFilters) =>
    onChange((p) => ({ ...p, filters: update(p.filters) }));

  const sizeLabel = (id: SizeBucketId) => {
    const { min, max } = sizeBucketBounds(id);
    return id === "tiny"
      ? t("sizeBelow", { max: max ?? "" })
      : max === null
        ? t("sizeAbove", { min })
        : t("sizeRange", { min, max });
  };
  const ageLabel = (id: AgeBucketId) => {
    const { min, max } = ageBucketMinutes(id);
    return min === 0
      ? t("ageBelow", { max: max ?? 0 })
      : max === null
        ? t("ageAbove", { min })
        : t("ageRange", { min, max });
  };
  const chipLabel = (chip: FilterChip): string => {
    switch (chip.type) {
      case "search":
        return t("chipSearch", { text: chip.value });
      case "kind":
        return t(`kinds.${chip.value}`);
      case "asset":
        return assetName(chip.value);
      case "fee":
        return chip.min !== null && chip.max !== null
          ? t("chipFeeRange", { min: formatFeeRate(chip.min), max: formatFeeRate(chip.max) })
          : chip.min !== null
            ? t("chipFeeMin", { min: formatFeeRate(chip.min) })
            : t("chipFeeMax", { max: formatFeeRate(chip.max ?? 0) });
      case "size":
        return sizeLabel(chip.value);
      case "age":
        return ageLabel(chip.value);
      case "only":
        return chip.value === "new" ? t("onlyNew") : t("onlyYours");
    }
  };
  const panelCount = chips.filter((c) => c.type !== "search" && c.type !== "kind").length;
  const listedAssets = assets.slice(0, MAX_ASSET_OPTIONS);
  // Keep a selected asset visible even when it dropped out of the top of the list.
  filters.assets.forEach((key) => {
    if (!listedAssets.some((a) => a.key === key)) listedAssets.push({ key, count: 0, cost: 0 });
  });

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <label className="relative flex min-w-0 flex-[1_1_12rem] items-center">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-fg-faint"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => {
              const search = e.target.value;
              setFilters((f) => ({ ...f, search }));
            }}
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            maxLength={100}
            className="h-8 w-full min-w-0 rounded-full border border-border bg-bg pl-8 pr-3 text-xs text-fg placeholder:text-fg-faint focus:border-primary"
          />
        </label>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
            open || panelCount > 0
              ? "border-primary text-primary"
              : "border-border text-fg-muted hover:text-fg"
          )}
        >
          <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
          {t("moreFilters")}
          {panelCount > 0 ? (
            <span className="tabular rounded-full bg-primary px-1.5 text-[10px] text-primary-fg">
              {panelCount}
            </span>
          ) : null}
        </button>
      </div>

      <div role="group" aria-label={t("filterKind")} className="flex flex-wrap items-center gap-1">
        {TX_KINDS.filter((k) => (kindCounts[k] ?? 0) > 0 || filters.kinds.includes(k)).map((k) => (
          <Chip
            key={k}
            active={filters.kinds.includes(k)}
            onClick={() => setFilters((f) => ({ ...f, kinds: toggle(f.kinds, k) }))}
            swatch={KIND_COLOR[k]}
          >
            {t(`kinds.${k}`)} <Count n={kindCounts[k] ?? 0} />
          </Chip>
        ))}
      </div>

      {open ? (
        <div
          id={panelId}
          className="grid grid-cols-1 gap-3 rounded-card border border-border bg-bg/40 p-3 sm:grid-cols-2"
        >
          <Group label={t("filterAsset")}>
            {listedAssets.length === 0 ? (
              <span className="text-[11px] text-fg-faint">{t("assetNone")}</span>
            ) : (
              listedAssets.map((a) => (
                <Chip
                  key={a.key}
                  active={filters.assets.includes(a.key)}
                  onClick={() => setFilters((f) => ({ ...f, assets: toggle(f.assets, a.key) }))}
                  swatch={a.key.startsWith("nft:") ? KIND_COLOR.nft : KIND_COLOR.cat}
                  title={t("assetTitle", { count: a.count, cost: formatCost(a.cost) })}
                >
                  {assetName(a.key)} <Count n={a.count} />
                </Chip>
              ))
            )}
          </Group>
          <Group label={t("filterFee")}>
            <RateInput
              label={t("feeMin")}
              placeholder={t("feeMinPlaceholder")}
              value={filters.feeMin}
              onChange={(feeMin) => setFilters((f) => ({ ...f, feeMin }))}
            />
            <span aria-hidden="true" className="text-fg-faint">
              –
            </span>
            <RateInput
              label={t("feeMax")}
              placeholder={t("feeMaxPlaceholder")}
              value={filters.feeMax}
              onChange={(feeMax) => setFilters((f) => ({ ...f, feeMax }))}
            />
            <span className="text-[11px] text-fg-faint">{t("feeUnit")}</span>
          </Group>
          <Group label={t("filterSize")}>
            {SIZE_BUCKETS.map((b) => (
              <Chip
                key={b.id}
                active={filters.sizes.includes(b.id)}
                onClick={() => setFilters((f) => ({ ...f, sizes: toggle(f.sizes, b.id) }))}
              >
                {sizeLabel(b.id)}
              </Chip>
            ))}
          </Group>
          <Group label={t("filterAge")}>
            {AGE_BUCKETS.map((b) => (
              <Chip
                key={b.id}
                active={filters.ages.includes(b.id)}
                onClick={() => setFilters((f) => ({ ...f, ages: toggle(f.ages, b.id) }))}
              >
                {ageLabel(b.id)}
              </Chip>
            ))}
          </Group>
          <Group label={t("showOnly")}>
            <Chip
              active={filters.only.includes("new")}
              onClick={() => setFilters((f) => ({ ...f, only: toggle(f.only, "new") }))}
            >
              {t("onlyNew")} <Count n={freshCount} />
            </Chip>
            {yoursCount > 0 || filters.only.includes("yours") ? (
              <Chip
                active={filters.only.includes("yours")}
                onClick={() => setFilters((f) => ({ ...f, only: toggle(f.only, "yours") }))}
              >
                {t("onlyYours")} <Count n={yoursCount} />
              </Chip>
            ) : null}
          </Group>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              {t("nonMatching")}
              <select
                value={prefs.nonMatching}
                onChange={(e) =>
                  onChange((p) => ({
                    ...p,
                    nonMatching: e.target.value === "hide" ? "hide" : "dim",
                  }))
                }
                className="h-7 rounded-full border border-border bg-bg px-2 text-[11px] font-semibold normal-case tracking-normal text-fg"
              >
                <option value="dim">{t("nonMatchingDim")}</option>
                <option value="hide">{t("nonMatchingHide")}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              {t("groupBy")}
              <select
                value={prefs.groupBy}
                onChange={(e) => onChange((p) => ({ ...p, groupBy: e.target.value as GroupBy }))}
                className="h-7 rounded-full border border-border bg-bg px-2 text-[11px] font-semibold normal-case tracking-normal text-fg"
              >
                <option value="none">{t("groupNone")}</option>
                <option value="fee">{t("groupFee")}</option>
                <option value="kind">{t("groupKind")}</option>
                <option value="asset">{t("groupAsset")}</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t("activeFilters")}
        >
          {chips.map((chip) => {
            const label = chipLabel(chip);
            return (
              <button
                key={chipKey(chip)}
                type="button"
                onClick={() => setFilters((f) => withoutChip(f, chip))}
                aria-label={t("chipRemove", { label })}
                className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-full bg-primary-soft px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/20"
              >
                <span className="truncate">{label}</span>
                <X aria-hidden="true" className="h-3 w-3 shrink-0" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setFilters(() => EMPTY_FILTERS)}
            className="min-h-7 px-2 text-[11px] font-semibold text-fg-muted underline-offset-2 hover:text-fg hover:underline"
          >
            {t("clearAll")}
          </button>
        </div>
      ) : null}

      <p aria-live="polite" className="text-[11px] text-fg-faint" data-testid="goggles-match">
        {summary
          ? t.rich("matchSummary", {
              matched: summary.count,
              total,
              cost: formatCost(summary.cost),
              share: formatShare(summary.share),
              b: (c) => <span className="tabular font-semibold text-fg-muted">{c}</span>,
            })
          : t("packedHint")}
      </p>
    </div>
  );
}
