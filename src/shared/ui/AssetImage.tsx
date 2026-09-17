"use client";

import { ImageOff } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { cn } from "@/shared/lib/cn";
import { isTrustedImageUrl } from "@/shared/lib/trustedImage";

/**
 * Lazy image with a placeholder while loading and a fallback when every candidate fails.
 * Plain <img> on purpose: next/image needs a server and host allow-list, neither of which the
 * Sage snapshot has. Candidates from an untrusted host or plain http are dropped before render
 * (TASK-051): these URLs come from Dexie/MintGarden data, including NFT metadata an NFT's
 * creator fully controls.
 */
export function AssetImage({ urls, alt, className, rounded = "rounded-card", style }: { urls: string[]; alt: string; className?: string; rounded?: string; style?: CSSProperties }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const trusted = urls.filter(isTrustedImageUrl);
  const src = trusted[index];
  if (!src) {
    return (
      <div role="img" aria-label={`${alt} (no image)`} style={style} className={cn("flex items-center justify-center bg-surface-2 text-fg-faint", rounded, className)}>
        <ImageOff size={28} aria-hidden="true" />
      </div>
    );
  }
  return (
    <div style={style} className={cn("relative overflow-hidden bg-surface-2", rounded, className)}>
      {!loaded ? <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-2" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setIndex((i) => i + 1);
        }}
        className={cn("h-full w-full object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
      />
    </div>
  );
}
