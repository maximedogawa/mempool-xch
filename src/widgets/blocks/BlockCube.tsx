"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * The block "cube": a front face whose lower part is filled proportionally to the block's
 * cost usage, with a skewed side face for depth. Original implementation styled after the
 * mempool.space silhouette (decision-003).
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
  const face: CSSProperties = {
    width: size,
    height: size,
    background:
      variant === "empty"
        ? "var(--block-empty)"
        : `linear-gradient(to top, rgba(8,10,20,0.28) ${Math.round(fill * 100)}%, var(--block-face) ${Math.round(fill * 100)}%), ${gradient}`,
    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
  };
  const depth = Math.round(size * 0.12);
  const body = (
    <div className={cn("relative", animate && "animate-block-in")} style={{ width: size + depth, height: size + depth }}>
      {/* top face */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0"
        style={{
          width: size,
          height: depth,
          background: variant === "empty" ? "var(--block-empty)" : "var(--block-top)",
          transform: `translateX(${depth}px) skewX(-45deg)`,
          transformOrigin: "bottom left",
          opacity: 0.95,
        }}
      />
      {/* right face */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: size,
          top: depth,
          width: depth,
          height: size,
          background: variant === "empty" ? "var(--block-empty)" : "var(--block-side)",
          transform: `translateY(-${depth}px) skewY(-45deg)`,
          transformOrigin: "top left",
        }}
      />
      {/* front face */}
      <div
        className={cn(
          "absolute left-0 flex flex-col items-center justify-center gap-0.5 rounded-[3px] border border-white/5 text-center text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] transition-transform",
          variant === "projected" && "border-dashed border-white/10",
          (onClick || href) && "group-hover:-translate-y-0.5"
        )}
        style={{ ...face, top: depth }}
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
