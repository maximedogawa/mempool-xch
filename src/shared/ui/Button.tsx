import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-cta text-cta-fg border-[var(--cta-edge)] font-bold hover:bg-cta-hover hover:-translate-y-px",
  secondary: "bg-surface text-fg hover:bg-surface-2 border-border",
  ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2 border-transparent",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-white border-transparent",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-control border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
