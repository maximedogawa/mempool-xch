import { cn } from "@/shared/lib/cn";

/** Isometric block mark: a periwinkle top face and deep periwinkle flank, drawn in thin ink. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <path d="M16 3 29 10 16 17 3 10z" fill="var(--primary-pastel)" />
      <path d="M16 17v12L3 22V10z" fill="var(--cta)" />
      <path d="M16 17v12l13-7V10z" fill="var(--block-side)" />
      <path
        d="M16 3 29 10v12L16 29 3 22V10zM3 10l13 7 13-7M16 17v12"
        fill="none"
        stroke="var(--fg)"
        strokeOpacity="0.55"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon-only below sm so a narrow header can give the search box more room. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="hidden text-lg font-bold tracking-[-0.02em] sm:inline">
        mempoolxch<span className="text-primary">.space</span>
      </span>
    </span>
  );
}
