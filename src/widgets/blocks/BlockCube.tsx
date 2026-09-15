"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * The block "cube": a front face whose lower part is filled proportionally to the block's
 * cost usage, with a lit top face and a shaded side face for depth, a bright fill line and a
 * soft inner glow. Original implementation styled after the mempool.space silhouette
 * (decision-003).
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
  size?: number;
}) {
  const depth = Math.round(size * 0.14);
  const pct = Math.round(Math.min(1, Math.max(0, fill)) * 100);
  const empty = variant === "empty";
  const front: CSSProperties = {
    width: size,
    height: size,
    top: depth,
    background: empty
      ? "var(--block-empty)"
      : [
          // empty part: dark glass with a faint grid so the fill level reads at a glance
          `linear-gradient(to top, transparent ${pct}%, color-mix(in srgb, var(--block-face) 88%, transparent) ${pct}%)`,
          `repeating-linear-gradient(to top, transparent 0 11px, rgba(255,255,255,0.035) 11px 12px)`,
          // filled part: the fee gradient with a vertical sheen and a bright waterline
          `linear-gradient(to top, rgba(0,0,0,0.18), rgba(255,255,255,0.10) ${Math.max(0, pct - 1)}%, rgba(255,255,255,0.55) ${pct}%, transparent ${pct + 1}%)`,
          gradient,
        ].join(", "),
    boxShadow: empty
      ? "inset 0 0 0 1px rgba(255,255,255,0.04)"
      : "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 -18px 30px -18px rgba(0,0,0,0.45), 0 14px 26px -14px rgba(0,0,0,0.7)",
    textShadow: "0 1px 2px rgba(0,0,0,0.65)",
  };
  const body = (
    <div className={cn("relative", animate && "animate-block-in")} style={{ width: size + depth, height: size + depth }}>
      {/* top face: lit */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0"
        style={{
          width: size,
          height: depth,
          background: empty ? "var(--block-empty)" : "linear-gradient(to right, color-mix(in srgb, var(--block-top) 70%, white 8%), var(--block-top))",
          transform: `translateX(${depth}px) skewX(-45deg)`,
          transformOrigin: "bottom left",
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
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
          background: empty ? "var(--block-empty)" : "linear-gradient(to bottom, var(--block-side), color-mix(in srgb, var(--block-side) 70%, black))",
          transform: `translateY(-${depth}px) skewY(-45deg)`,
          transformOrigin: "top left",
          borderTopRightRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />
      {/* front face */}
      <div
        className={cn(
          "absolute left-0 flex flex-col items-center justify-center gap-0.5 rounded-[4px] text-center text-fg transition-transform duration-200",
          variant === "projected" && "outline-1 outline-dashed outline-white/15 -outline-offset-4",
          (onClick || href) && "group-hover:-translate-y-1"
        )}
        style={front}
      >
        {children}
      </div>
    </div>
  );
  const common = "group relative inline-block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className={cn(common, className)}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={cn(common, className)}>
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
