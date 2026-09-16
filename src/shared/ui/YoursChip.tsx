/** Marks a mempool item that belongs to the connected Sage wallet. */
export function YoursChip({ className = "" }: { className?: string }) {
  return <span className={`inline-flex h-5 shrink-0 items-center rounded-full bg-primary px-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0a0d18] ${className}`}>yours</span>;
}
