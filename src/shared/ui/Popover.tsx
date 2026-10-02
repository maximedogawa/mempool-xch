"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * Click-to-open panel anchored under a trigger button: closes on an outside click or Escape,
 * returns focus to the trigger on close. Used for the header's nav "More" menu and info panel,
 * where a plain hover Tooltip is not enough because the content is interactive (links).
 */
export function Popover({
  trigger,
  children,
  align = "start",
  panelClassName,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  panelClassName?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <div ref={triggerRef}>{trigger({ open, toggle: () => setOpen((o) => !o) })}</div>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "absolute top-full z-40 mt-2 min-w-[200px] rounded-sm border border-border bg-bg-elevated p-1.5 text-sm shadow-card",
            align === "end" ? "right-0" : "left-0",
            panelClassName
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
