import { cn } from "@/shared/lib/cn";

/** Original mark: an isometric block with a leaf-green top face. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <path d="M16 3 29 10v12L16 29 3 22V10z" fill="var(--block-side)" />
      <path d="M16 3 29 10 16 17 3 10z" fill="var(--primary)" />
      <path d="M16 17v12L3 22V10z" fill="var(--primary-strong)" opacity="0.85" />
      <path d="M16 17v12l13-7V10z" fill="var(--block-top)" />
      <path d="M11 12.5c2.2-2.6 5.5-3.3 8.4-2.3-1.1 2.9-3.7 4.6-6.9 4.4-.6 0-1.1-.1-1.5-.3.7-1.1 1.9-2 3.2-2.4-1.3.1-2.4.4-3.2.6z" fill="var(--primary-fg)" opacity="0.9" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">
        mempool<span className="text-primary">.xch</span>
      </span>
    </span>
  );
}
