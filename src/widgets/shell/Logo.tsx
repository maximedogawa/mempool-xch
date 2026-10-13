import { cn } from "@/shared/lib/cn";

/**
 * The mempoolxch mark (studio plate p151): a soft isometric block, the top in gold, the left face in
 * ink, the right in verdigris, and one red light on the top corner, the next block's signal.
 * Colours are the brand's own, not the theme's; only the ink face follows `--fg`, so on Nacht it
 * turns cream and the cube still reads.
 */
export function LogoMark({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      strokeLinejoin="round"
      strokeWidth={2.6}
    >
      <path d="M16 16.6V29.4L4.6 22.8V9.9z" fill="var(--fg)" stroke="var(--fg)" />
      <path d="M16 16.6V29.4l11.4-6.6V9.9z" fill="#4f9a86" stroke="#4f9a86" />
      <path d="M16 3.3 27.4 9.9 16 16.6 4.6 9.9z" fill="#c69c66" stroke="#c69c66" />
      <circle cx="22.6" cy="9.7" r="1.7" fill="#e75839" />
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
