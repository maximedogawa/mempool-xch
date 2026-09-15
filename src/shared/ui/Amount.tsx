import { formatAmount, formatXch, type Mojos } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";

export function Amount({ mojos, className, exact = false }: { mojos: Mojos; className?: string; exact?: boolean }) {
  return (
    <span className={cn("tabular", className)} title={`${formatXch(mojos)} XCH (${mojos.toString()} mojo)`}>
      {exact ? `${formatXch(mojos)} XCH` : formatAmount(mojos)}
    </span>
  );
}
