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
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-card border border-dashed px-6 py-10 text-center",
        tone === "danger" ? "border-danger/50 text-danger" : "border-border text-fg-muted",
        className
      )}
    >
      {tone === "neutral" && !plain ? (
        <FlowTrace className="absolute inset-x-0 bottom-0 h-12 opacity-80" />
      ) : null}
      <div className="relative text-base font-semibold">{title}</div>
      {description ? (
        <div className="relative max-w-md text-sm text-fg-faint">{description}</div>
      ) : null}
      {action ? <div className="relative">{action}</div> : null}
    </div>
  );
}
