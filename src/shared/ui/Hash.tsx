import Link from "next/link";
import { shortId } from "@/shared/lib/chia/hex";
import { cn } from "@/shared/lib/cn";
import { CopyButton } from "./CopyButton";

/** A hex id or address, shortened, monospace, optionally linked and copyable. */
export function Hash({
  value,
  href,
  full = false,
  copy = false,
  head = 8,
  tail = 6,
  className,
}: {
  value: string;
  href?: string;
  full?: boolean;
  copy?: boolean;
  head?: number;
  tail?: number;
  className?: string;
}) {
  const text = full ? value : shortId(value, head, tail);
  const body = href ? (
    <Link href={href} className="mono text-accent hover:underline" title={value}>
      {text}
    </Link>
  ) : (
    <span className="mono" title={value}>
      {text}
    </span>
  );
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1 break-all", className)}>
      {body}
      {copy ? <CopyButton value={value} /> : null}
    </span>
  );
}
