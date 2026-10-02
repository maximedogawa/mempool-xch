"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";

/**
 * The block "cube": a front face whose lower part is filled proportionally to the block's
 * cost usage, with a lit top face and a shaded side face for depth and a thin waterline. Original implementation styled after the mempool.space silhouette
 *.
 */
export function BlockCube({
  fill,
  gradient,
  variant,
  children,
  onClick,
  href,
  ariaLabel,
  className,
  animate = false,
  glow = false,
  selected = false,
  watched = false,
  size = 124,
}: {
  /** 0..1 */
  fill: number;
  /** CSS background for the filled part of the front face. */
  gradient: string;
  variant: "projected" | "confirmed" | "empty";
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
  className?: string;
  animate?: boolean;
  /** A still, soft halo following the cube silhouette (the next block). */
  glow?: boolean;
  /** Highlight the front face (drill-down open). */
  selected?: boolean;
  /** A transaction followed in the watchlist is in this block. */
  watched?: boolean;
  size?: number;
}) {
  const depth = Math.round(size * 0.2);
  const pct = Math.round(Math.min(1, Math.max(0, fill)) * 100);
  const empty = variant === "empty";
  const front: CSSProperties = {
    width: size,
    height: size,
    top: depth,
    background: empty
      ? "var(--block-empty)"
      : [
          // empty part: glass with a faint ruled grid so the fill level reads at a glance
          `linear-gradient(to top, transparent ${pct}%, var(--cube-glass) ${pct}%)`,
          `repeating-linear-gradient(to top, transparent 0 11px, var(--cube-grid) 11px 12px)`,
          // filled part: the fee gradient with a faint sheen and a thin ink waterline
          `linear-gradient(to top, var(--cube-fill-shade), var(--cube-sheen) ${Math.max(0, pct - 1)}%, var(--cube-waterline) ${pct}%, transparent ${pct + 1}%)`,
          gradient,
        ].join(", "),
    boxShadow: empty ? "var(--cube-empty-edge)" : "var(--cube-edge), var(--cube-drop)",
    textShadow: "var(--cube-text-shadow)",
  };
  const body = (
    <div
      className={cn("relative", animate && "animate-block-in", glow && "animate-cube-glow")}
      style={{ width: size + depth, height: size + depth }}
    >
      {/* top face: lit */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0"
        style={{
          width: size,
          height: depth,
          background: empty
            ? "var(--block-empty)"
            : "linear-gradient(to right, var(--cube-top-hi), var(--block-top))",
          transform: "skewX(-45deg)",
          transformOrigin: "bottom left",
          borderTopRightRadius: 3,
          boxShadow: "inset 0 1px 0 var(--cube-top-line)",
        }}
      />
      {/* side face: shaded */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: size,
          top: depth,
          width: depth,
          height: size,
          background: empty
            ? "var(--block-empty)"
            : "linear-gradient(to bottom, var(--cube-side-from), var(--cube-side-to))",
          transform: "skewY(-45deg)",
          transformOrigin: "top left",
          borderBottomRightRadius: 3,
        }}
      />
      {/* front face */}
      <div
        className={cn(
          "absolute left-0 flex flex-col items-center justify-center gap-0.5 rounded-[3px] rounded-tr-none text-center text-fg transition-transform duration-200",
          variant === "projected" &&
            !selected &&
            !watched &&
            "outline-1 outline-dashed outline-[var(--cube-dash)] -outline-offset-4",
          watched && !selected && "outline-2 outline-solid outline-warning -outline-offset-2",
          selected && "outline-2 outline-solid outline-primary -outline-offset-2",
          (onClick || href) && "group-hover:-translate-y-1"
        )}
        style={front}
      >
        {children}
      </div>
    </div>
  );
  const common =
    "group relative inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className={cn(common, className)}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(common, className)}
      >
        {body}
      </button>
    );
  }
  return (
    <div aria-label={ariaLabel} role="img" className={cn(common, className)}>
      {body}
    </div>
  );
}

/**
 * A loading block with the exact geometry of a loaded one: the height label above, the cube
 * (faces included) with placeholder lines where its figures go, and the chip below, so the
 * row keeps its height when the data arrives.
 */
export function BlockCubeSkeleton({ size = 124 }: { size?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-1">
      <Skeleton className="h-4 w-14" />
      <BlockCube fill={0} gradient="" variant="empty" ariaLabel="" size={size}>
        <Skeleton className="h-[15px] w-3/5" />
        <Skeleton className="mt-1 h-2.5 w-2/5" />
        <Skeleton className="mt-2.5 h-[13px] w-1/2" />
        <Skeleton className="mt-1 h-[11px] w-2/5" />
      </BlockCube>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}
