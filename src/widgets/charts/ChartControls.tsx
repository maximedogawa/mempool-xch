"use client";

import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { RANGES, type RangeId } from "@/shared/lib/charts/range";
import { SMOOTHING_LEVELS, type SmoothingId } from "@/shared/lib/charts/smoothing";

export type ScaleId = "linear" | "log";

export interface ChartControlsState {
  range: RangeId;
  smoothing: SmoothingId;
  scale: ScaleId;
}

function RadioRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            onClick={() => onSelect(opt.id)}
            className={cn(
              "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
              selected === opt.id
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-bg text-fg-muted hover:text-fg"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const SCALES: readonly ScaleId[] = ["linear", "log"];

export function ChartControls({
  value,
  onChange,
}: {
  value: ChartControlsState;
  onChange: (next: ChartControlsState) => void;
}) {
  const t = useT("charts");
  const scales = SCALES.map((id) => ({ id, label: t(`controls.${id}`) }));
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-border bg-bg-elevated p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      <RadioRow
        label={t("controls.range")}
        options={RANGES}
        selected={value.range}
        onSelect={(range) => onChange({ ...value, range })}
      />
      <RadioRow
        label={t("controls.smoothing")}
        options={SMOOTHING_LEVELS}
        selected={value.smoothing}
        onSelect={(smoothing) => onChange({ ...value, smoothing })}
      />
      <RadioRow
        label={t("controls.scale")}
        options={scales}
        selected={value.scale}
        onSelect={(scale) => onChange({ ...value, scale })}
      />
    </div>
  );
}
