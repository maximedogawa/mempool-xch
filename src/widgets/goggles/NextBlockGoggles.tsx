"use client";

import { useCallback, useMemo, useRef } from "react";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { useTokenList } from "@/shared/api/useTokenList";
import { formatCost, formatPercent } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatEta } from "@/shared/lib/format/time";
import { FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { useWalletPendingIds } from "@/shared/lib/sage/usePendingIds";
import { Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";
import { useT } from "@/shared/i18n/useT";
import { BlockSummary } from "./BlockSummary";
import { GogglesFilterBar } from "./GogglesFilters";
import { GogglesLegend } from "./GogglesLegend";
import { GogglesTreemap, type TreemapContext } from "./GogglesTreemap";
import { useGogglesPrefs, useNftInfo, useNow, usePageVisible } from "./hooks";
import {
  assetKeysOf,
  assetMix,
  assetOptions,
  EMPTY_FILTERS,
  isFiltering,
  isFreshItem,
  kindCounts,
  matchesFilters,
  primaryAssetKey,
  summariseMatches,
  type ColourMode,
  type MatchContext,
} from "./model";
import gogglesNs from "@/shared/i18n/messages/en/goggles";

/** Bundles first seen more recently than this count as "new" and carry the arrival marker. */
const FRESH_MS = 90_000;

/**
 * "Goggles" for the next projected block: every spend bundle that will make the next
 * transaction block is a tile sized by CLVM cost and coloured by fee band or asset kind, with no
 * text on it; details live in the tooltip anchored to each tile and in the block card above.
 * Composition only: the pure logic is in ./model.ts and ./format.ts, drawing and animation in
 * GogglesTreemap and GogglesTiles, the controls in GogglesFilterBar.
 */
export function NextBlockGoggles() {
  const t = useT(gogglesNs);
  const { blocks, summary, isLoading } = useProjectedBlocks(8);
  const [prefs, setPrefs] = useGogglesPrefs();
  const tokens = useTokenList();
  const mine = useWalletPendingIds();
  const visible = usePageVisible();
  const now = useNow(visible);
  const next = blocks[0];
  const items = useMemo(() => next?.items ?? [], [next]);
  const blockMax = summary?.state.blockMaxCost ?? 11_000_000_000;
  const txHeight = summary?.state.lastTxBlockHeight ?? null;

  // Everything in the first snapshot was already waiting when this tab opened: only bundles
  // observed after it count as arrivals. (The last visit's snapshot is not a sync of this tab.)
  const baseline = useRef<number | null>(null);
  if (
    summary &&
    summary.source !== "snapshot" &&
    summary.source !== "syncing" &&
    baseline.current === null
  )
    baseline.current = summary.generatedAt;
  const baselineAt = baseline.current;

  const nft = useNftInfo(items);
  const tokenMap = tokens.data;
  const ticker = useCallback((assetId: string) => tokenMap?.[assetId]?.symbol, [tokenMap]);
  const collectionOf = useCallback((l: string) => nft.collection(l)?.id ?? null, [nft]);
  const assetKeys = useCallback(
    (item: CompactMempoolItem) => assetKeysOf(item, collectionOf),
    [collectionOf]
  );
  const assetKey = useCallback(
    (item: CompactMempoolItem) => primaryAssetKey(item, collectionOf),
    [collectionOf]
  );

  const ctx = useMemo<MatchContext & TreemapContext>(() => {
    const names = (item: CompactMempoolItem): string[] => {
      const out: string[] = [];
      (item.assets?.cats ?? []).forEach((c) => {
        const token = tokenMap?.[c.assetId];
        if (token) out.push(token.name, token.symbol);
      });
      if (item.kind === "nft")
        item.assetIds.forEach((l) => {
          const name = nft.name(l);
          const collection = nft.collection(l)?.name;
          if (name) out.push(name);
          if (collection) out.push(collection);
        });
      return out;
    };
    return {
      now,
      isNew: (item) => isFreshItem(item, baselineAt, now, FRESH_MS),
      isFresh: (item) => isFreshItem(item, baselineAt, now, FRESH_MS),
      isYours: (item) => mine.has(item.id),
      assetKeys,
      names,
      assetKey,
      groupLabel: () => null,
      ticker,
      nftImage: nft.image,
      nftName: nft.name,
      collectionName: (l) => nft.collection(l)?.name ?? null,
      nftVerdict: nft.verdict,
    };
  }, [now, baselineAt, mine, assetKeys, assetKey, tokenMap, nft, ticker]);

  /** Display name of an asset or group key. */
  const collectionNames = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.kind !== "nft") return;
      item.assetIds.forEach((l) => {
        const c = nft.collection(l);
        if (c?.name) map.set(c.id, c.name);
      });
    });
    return map;
  }, [items, nft]);
  const assetName = useCallback(
    (key: string): string => {
      const [type, id = ""] = key.split(":");
      if (type === "cat") {
        const token = tokenMap?.[id];
        return token ? token.symbol || token.name : t("unknownCat", { id: id.slice(0, 6) });
      }
      if (type === "nft") return collectionNames.get(id) ?? t("unknownCollection");
      if (type === "kind") return t(`kinds.${id as CompactMempoolItem["kind"]}`);
      return key;
    },
    [tokenMap, collectionNames, t]
  );
  const groupLabel = useCallback(
    (key: string): string | null => {
      if (prefs.groupBy === "fee") {
        const band = FEE_BANDS.find((b) => b.id === key);
        return band
          ? band.id === "zero"
            ? t("zeroFee")
            : t("bandChip", { band: band.label })
          : null;
      }
      if (prefs.groupBy === "kind") return t(`kinds.${key as CompactMempoolItem["kind"]}`);
      if (prefs.groupBy === "asset") return assetName(key);
      return null;
    },
    [prefs.groupBy, assetName, t]
  );
  const treemapCtx = useMemo(() => ({ ...ctx, groupLabel }), [ctx, groupLabel]);

  const filtering = isFiltering(prefs.filters);
  const matched = useMemo(
    () => (filtering ? items.filter((i) => matchesFilters(i, prefs.filters, ctx)) : null),
    [filtering, items, prefs.filters, ctx]
  );
  const matchedIds = useMemo(() => (matched ? new Set(matched.map((i) => i.id)) : null), [matched]);
  const matchSummary = useMemo(
    () => (matched ? summariseMatches(items, matched) : null),
    [items, matched]
  );
  const counts = useMemo(() => kindCounts(items), [items]);
  const mix = useMemo(() => assetMix(items), [items]);
  const options = useMemo(() => assetOptions(items, ctx.assetKeys), [items, ctx.assetKeys]);
  const freshCount = useMemo(() => items.filter(ctx.isNew).length, [items, ctx]);
  const yoursCount = useMemo(() => items.filter(ctx.isYours).length, [items, ctx]);

  const label = next
    ? t("ariaLabel", {
        count: next.items.length,
        cost: formatCost(next.totalCost),
        max: formatCost(blockMax),
        percent: formatPercent(next.fill),
        eta: formatEta(next.etaSeconds),
      })
    : t("ariaLabelEmpty");

  const setColour = (colour: ColourMode) => setPrefs((p) => ({ ...p, colour }));

  return (
    <Card data-testid="goggles">
      <CardHeader
        title={t("title")}
        action={
          <div
            role="group"
            aria-label={t("colourBy")}
            className="inline-flex overflow-hidden rounded-full border border-border"
          >
            {(["fee", "kind"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={prefs.colour === m}
                onClick={() => setColour(m)}
                className={cn(
                  "seg rounded-none border-0 text-[11px]",
                  prefs.colour === m && "seg-on"
                )}
              >
                {m === "fee" ? t("modeFee") : t("modeKind")}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="min-w-0">
        {isLoading && !next ? (
          <div className="grid gap-6 md:grid-cols-[minmax(0,276px)_minmax(0,1fr)]">
            <Skeleton className="mx-auto aspect-square w-full max-w-[276px]" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ) : !next ? (
          <p className="py-10 text-center text-sm text-fg-faint">{t("empty")}</p>
        ) : (
          // The block beside its figures on a wide screen, above them on a phone.
          <div className="grid items-start gap-5 md:grid-cols-[minmax(0,276px)_minmax(0,1fr)]">
            <GogglesTreemap
              items={items}
              matched={matchedIds}
              nonMatching={prefs.nonMatching}
              groupBy={prefs.groupBy}
              colour={prefs.colour}
              blockMaxCost={blockMax}
              txHeight={txHeight}
              label={label}
              ctx={treemapCtx}
              emptyState={
                <div className="flex max-w-sm flex-col items-center gap-2">
                  <p className="text-sm font-semibold text-fg">{t("emptyFiltered")}</p>
                  <p className="text-xs text-fg-muted">{t("emptyFilteredHint")}</p>
                  <button
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, filters: EMPTY_FILTERS }))}
                    className="seg rounded-full text-primary"
                  >
                    {t("clearAll")}
                  </button>
                </div>
              }
            />
            <div className="flex min-w-0 flex-col gap-3">
              <BlockSummary
                block={next}
                blockMaxCost={blockMax}
                mix={mix}
                freshCount={freshCount}
                freshSeconds={Math.round(FRESH_MS / 1000)}
              />
              <GogglesFilterBar
                prefs={prefs}
                onChange={setPrefs}
                kindCounts={counts}
                assets={options}
                assetName={assetName}
                freshCount={freshCount}
                yoursCount={yoursCount}
                total={items.length}
                summary={matchSummary}
              />
              <GogglesLegend colour={prefs.colour} kinds={mix.map((m) => m.kind)} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
