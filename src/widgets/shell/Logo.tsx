import { cn } from "@/shared/lib/cn";

/**
 * Isometric block mark in the theme's identity colour: a solid top face, a deep flank, a tinted
 * side, a lit top edge and ink outlines, with a still halo in the theme's --glow so it stands out
 * on any surface.
 */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_0_6px_var(--glow)]", className)}
    >
      <path d="M16 3 29 10 16 17 3 10z" fill="var(--cta)" />
      <path d="M16 17v12L3 22V10z" fill="var(--primary-strong)" />
      <path d="M16 17v12l13-7V10z" fill="var(--primary-tint)" />
      <path
        d="M3.8 10 16 3.6 28.2 10"
        fill="none"
        stroke="var(--cta-fg)"
        strokeOpacity="0.55"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M16 3 29 10v12L16 29 3 22V10zM3 10l13 7 13-7M16 17v12"
        fill="none"
        stroke="var(--fg)"
        strokeOpacity="0.85"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon-only below sm so a narrow header can give the search box more room. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="hidden text-xl font-extrabold leading-none tracking-[-0.035em] sm:inline">
        mempool<span className="text-primary">xch</span>
        <span className="font-semibold text-fg-muted">.space</span>
      </span>
    </span>
  );
}
