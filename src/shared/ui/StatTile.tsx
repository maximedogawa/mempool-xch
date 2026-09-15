import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Tooltip } from "./Tooltip";

export function StatTile({
  label,
  value,
  sub,
  hint,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "danger";
  className?: string;
}) {
  const valueTone = {
    default: "text-fg",
    primary: "text-primary",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 rounded-card border border-border bg-surface px-4 py-3", className)}>
      <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
        <span className="truncate">{label}</span>
        {hint ? <Tooltip text={hint} /> : null}
      </div>
      <div className={cn("tabular truncate text-xl font-semibold leading-tight", valueTone)}>{value}</div>
      {sub ? <div className="truncate text-xs text-fg-faint">{sub}</div> : null}
    </div>
  );
}
