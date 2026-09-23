"use client";

import { EyeOff, ImageOff, Play } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import { isVeiled, sensitivityText, type Sensitivity } from "@/shared/lib/nft/sensitivity";
import { isTrustedImageUrl, isTrustedVideoUrl } from "@/shared/lib/trustedImage";
import uiNs from "@/shared/i18n/messages/en/ui";

/**
 * Lazy image with a placeholder while loading and a fallback when every candidate fails.
 * Plain <img> on purpose: next/image needs a server and host allow-list, neither of which the
 * Sage snapshot has. Candidates from an untrusted host or plain http are dropped before render
 *: these URLs come from Dexie/MintGarden data, including NFT metadata an NFT's
 * creator fully controls.
 *
 * `sensitivity` veils artwork MintGarden marks as sensitive or blocked (see
 * lib/nft/sensitivity.ts) behind frosted glass: the art is still drawn, blurred past
 * recognition and out of the accessibility tree, so a page keeps its shape and the viewer can
 * tell one veiled item from the next. Revealing is per item and lives in this component only,
 * so it lasts for the visit and is never stored or sent anywhere.
 *
 * `videoUrl` is for an NFT whose artwork is a video: the still stands in as the poster (and as
 * the blurred silhouette while veiled), and the player is only mounted once the artwork may be
 * shown, so a veiled video is never downloaded. Sage's own CSP allows no remote media, so there
 * the poster is all there is; the hosted build allows the same trusted hosts as images.
 */
export function AssetImage({
  urls,
  alt,
  className,
  rounded = "rounded-card",
  style,
  sensitivity,
  veilDetail = true,
  videoUrl,
}: {
  urls: string[];
  alt: string;
  className?: string;
  rounded?: string;
  style?: CSSProperties;
  sensitivity?: Sensitivity | null;
  /** False for thumbnails too small for wording: the icon and the tooltip carry it instead. */
  veilDetail?: boolean;
  videoUrl?: string | null;
}) {
  const t = useT(uiNs);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [veilArtFailed, setVeilArtFailed] = useState(false);
  // A route that swaps one item for another (NFT to NFT) re-renders this same element, and React
  // keeps its state unless something resets it. Revealing one item must never reveal the next.
  const identity = `${urls.join("|")}::${videoUrl ?? ""}::${sensitivity?.level ?? "clear"}`;
  const [seen, setSeen] = useState(identity);
  if (seen !== identity) {
    setSeen(identity);
    setIndex(0);
    setLoaded(false);
    setRevealed(false);
    setVeilArtFailed(false);
  }
  const trusted = urls.filter(isTrustedImageUrl);
  const src = trusted[index];
  const video = videoUrl && isTrustedVideoUrl(videoUrl) ? videoUrl : null;
  if (!src && !video) {
    return (
      <div
        role="img"
        aria-label={t("image.noImage", { alt })}
        style={style}
        className={cn(
          "flex items-center justify-center bg-surface-2 text-fg-faint",
          rounded,
          className
        )}
      >
        <ImageOff size={28} aria-hidden="true" />
      </div>
    );
  }
  if (isVeiled(sensitivity) && !revealed) {
    const { title, reason, summary } = sensitivityText(sensitivity!);
    // The media is drawn as it is; the glass laid over it does the obscuring, so what shows
    // through is the real picture behind frosted glass rather than a smeared copy of it.
    const media =
      veilArtFailed || !src ? null : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          // Only what shows through is lost when this fails; the glass itself must stay, so this
          // never walks the candidate list on to the plain "no image" box.
          onError={() => setVeilArtFailed(true)}
          className="veil-art absolute inset-0 h-full w-full object-cover"
        />
      );
    const glass = (
      <span className="veil-glass absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[color-mix(in_srgb,var(--surface)_22%,transparent)] p-2 text-center backdrop-blur-xl transition-colors duration-200 group-hover:bg-[color-mix(in_srgb,var(--surface)_10%,transparent)]">
        <EyeOff
          size={veilDetail ? 24 : 14}
          aria-hidden="true"
          className="shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        />
        {veilDetail ? (
          <>
            <span className="veil-text text-xs font-semibold leading-snug">{title}</span>
            {reason ? (
              <span className="veil-text line-clamp-2 text-[11px] leading-snug">
                <span className="opacity-70">{t("image.reason")}</span>
                {reason}
              </span>
            ) : null}
            {video ? (
              <span className="flex items-center gap-1 text-[10px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                <Play size={10} aria-hidden="true" /> {t("image.video")}
              </span>
            ) : null}
            <span className="rounded-full border border-border bg-surface/70 px-2.5 py-1 text-[11px] font-semibold text-accent shadow-sm transition-colors group-hover:bg-surface">
              {t("image.showAnyway")}
            </span>
          </>
        ) : null}
      </span>
    );
    // Thumbnails in lists already sit inside a link to the item, and a button inside a link is
    // invalid and unreachable: there the glass is plain decoration and the item page reveals.
    if (!veilDetail) {
      return (
        <span
          title={summary}
          style={style}
          className={cn("group relative block overflow-hidden bg-surface-2", rounded, className)}
        >
          {media}
          {glass}
          <span className="sr-only">{t("image.veiled", { alt, summary })}</span>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        title={t("image.clickToShow", { summary })}
        style={style}
        className={cn(
          "group relative overflow-hidden bg-surface-2 text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          rounded,
          className
        )}
      >
        {media}
        {glass}
        <span className="sr-only">{t("image.veiledButton", { alt, summary })}</span>
      </button>
    );
  }
  if (video) {
    return (
      <div
        style={style}
        className={cn("relative overflow-hidden bg-surface-2", rounded, className)}
      >
        {/* Third-party NFT artwork: there is no caption track to offer. */}
        <video
          src={video}
          poster={src}
          controls
          loop
          playsInline
          preload="none"
          aria-label={alt}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div style={style} className={cn("relative overflow-hidden bg-surface-2", rounded, className)}>
      {!loaded ? (
        <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-surface-2" />
      ) : null}
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
        className={cn(
          "h-full w-full object-cover transition-opacity",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
