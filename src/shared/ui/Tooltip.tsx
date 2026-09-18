import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** Accessible hover/focus tooltip; renders an info icon when no child is given. */
export function Tooltip({
  text,
  children,
  className,
  placement = "top",
}: {
  text: string;
  children?: ReactNode;
  className?: string;
  /** Which side of the trigger the bubble opens toward. Use "bottom" near the top of the viewport, where a "top" bubble would get clipped. */
  placement?: "top" | "bottom";
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        aria-label={text}
        className="inline-flex cursor-help items-center rounded-sm border-0 bg-transparent p-0 text-fg-faint"
      >
        {children ?? <Info size={13} aria-hidden="true" />}
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-30 hidden w-max max-w-[260px] -translate-x-1/2 rounded-sm border border-border-strong bg-bg-elevated px-2.5 py-1.5 text-left text-xs font-normal normal-case tracking-normal text-fg shadow-card group-hover:block group-focus-within:block",
          placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
        )}
      >
        {text}
      </span>
    </span>
  );
}
