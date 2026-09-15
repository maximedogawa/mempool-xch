import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function EmptyState({
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-card border border-dashed px-6 py-10 text-center",
        tone === "danger" ? "border-danger/50 text-danger" : "border-border text-fg-muted",
        className
      )}
    >
      <div className="text-base font-semibold">{title}</div>
      {description ? <div className="max-w-md text-sm text-fg-faint">{description}</div> : null}
      {action}
    </div>
  );
}
