import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { FlowTrace } from "./FlowTrace";

export function EmptyState({
  title,
  description,
  action,
  tone = "neutral",
  plain = false,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  /** No flow trace: for empty states inside dense panels. */
  plain?: boolean;
  className?: string;
}) {
  const trace = tone === "neutral" && !plain;
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-card border border-dashed px-6 py-10 text-center",
        // The text and the action stay clear of the trace below them.
        trace && "pb-24",
        tone === "danger" ? "border-danger/50 text-danger" : "border-border text-fg-muted",
        className
      )}
    >
      {trace ? (
        // Tall enough for the lanes to read as lanes (a 48 px strip cut them into a band of
        // lines through the text), faded towards the text above it and at the card's edge,
        // where the arc would otherwise end as a stray sliver against the border.
        <FlowTrace className="absolute inset-x-0 bottom-0 h-24 opacity-70 [mask-composite:intersect] [mask-image:linear-gradient(to_top,black_35%,transparent),linear-gradient(to_left,transparent,black_15%)]" />
      ) : null}
      <div className="relative text-base font-semibold">{title}</div>
      {description ? (
        <div className="relative max-w-md text-sm text-fg-faint">{description}</div>
      ) : null}
      {action ? <div className="relative">{action}</div> : null}
    </div>
  );
}
