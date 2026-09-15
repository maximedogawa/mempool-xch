import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** Accessible hover/focus tooltip; renders an info icon when no child is given. */
export function Tooltip({ text, children, className }: { text: string; children?: ReactNode; className?: string }) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <span tabIndex={0} aria-label={text} className="inline-flex cursor-help items-center rounded-sm text-fg-faint">
        {children ?? <Info size={13} aria-hidden="true" />}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[260px] -translate-x-1/2 rounded-sm border border-border-strong bg-bg-elevated px-2.5 py-1.5 text-left text-xs font-normal normal-case tracking-normal text-fg opacity-0 shadow-card transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
