"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "@/shared/ui/Skeleton";

/**
 * The goggles treemap and the two live feeds sit below the first screen. Their code is split
 * out of the dashboard's initial JavaScript and they mount once the browser is idle after the
 * first paint, or as soon as the visitor scrolls near them, whichever comes first. The
 * placeholders reserve the space so nothing shifts when they arrive.
 */
const NextBlockGoggles = dynamic(
  () => import("@/widgets/goggles/NextBlockGoggles").then((m) => m.NextBlockGoggles),
  { ssr: false, loading: () => <Skeleton className="h-[420px] w-full" /> }
);
const LiveTransactions = dynamic(
  () => import("@/widgets/feed/LiveFeed").then((m) => m.LiveTransactions),
  { ssr: false, loading: () => <Skeleton className="h-[360px] w-full" /> }
);
const LatestBlocks = dynamic(() => import("@/widgets/feed/LiveFeed").then((m) => m.LatestBlocks), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

const IDLE_TIMEOUT_MS = 2_000;

function useDeferredMount() {
  const anchor = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (mounted) return;
    const mount = () => setMounted(true);
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(mount, { timeout: IDLE_TIMEOUT_MS })
        : null;
    const timer = idle === null ? window.setTimeout(mount, IDLE_TIMEOUT_MS) : null;
    const observer =
      typeof IntersectionObserver === "function" && anchor.current
        ? new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && mount(), {
            rootMargin: "400px",
          })
        : null;
    if (observer && anchor.current) observer.observe(anchor.current);
    return () => {
      if (idle !== null) window.cancelIdleCallback(idle);
      if (timer !== null) window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [mounted]);
  return { anchor, mounted };
}

function Deferred({ placeholder, children }: { placeholder: ReactNode; children: ReactNode }) {
  const { anchor, mounted } = useDeferredMount();
  return <div ref={anchor}>{mounted ? children : placeholder}</div>;
}

export function BelowTheFold() {
  return (
    <Deferred
      placeholder={
        <div className="flex flex-col gap-5">
          <Skeleton className="h-[420px] w-full" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Skeleton className="h-[360px] w-full" />
            <Skeleton className="h-[360px] w-full" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <NextBlockGoggles />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <LiveTransactions />
          <LatestBlocks />
        </div>
      </div>
    </Deferred>
  );
}
