import { cn } from "@/shared/lib/cn";

const STICKERS = {
  /** p106: one chubby block, squashed as if it just landed in line, smiling. */
  block: { src: "/brand/sticker-block.png", width: 318, height: 277 },
  /** p105: the same block with a spark on its top corner. */
  spark: { src: "/brand/sticker-block-spark.png", width: 315, height: 268 },
} as const;

/**
 * A mempoolxch sticker from the Beidwerk studio (marks-kinetic): play lives in the marks, so the
 * NFT pages carry one; around it the page stays calm. Decorative, so hidden from screen readers.
 */
export function NftSticker({
  kind = "block",
  size = 96,
  className,
}: {
  kind?: keyof typeof STICKERS;
  size?: number;
  className?: string;
}) {
  const sticker = STICKERS[kind];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a static file, also served in the Sage static build
    <img
      src={sticker.src}
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round((size * sticker.height) / sticker.width)}
      className={cn("pointer-events-none select-none", className)}
      draggable={false}
    />
  );
}
