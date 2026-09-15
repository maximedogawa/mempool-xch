"use client";

import { useState } from "react";
import { useProjectedBlocks, useRecentBlocks } from "@/shared/api/hooks";
import { CHIA } from "@/shared/config/networks";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { ProjectedBlockDetails } from "./ProjectedBlockDetails";
import { ProjectedBlocks } from "./ProjectedBlocks";
import { RecentBlocks } from "./RecentBlocks";

/**
 * The signature mempool.space row: projected blocks left of a dotted divider, confirmed blocks
 * right of it. Each side scrolls on its own and is anchored to the divider, so the next block
 * and the latest block are always visible.
 */
export function BlocksRow() {
  const { settings } = useSettings();
  const projected = useProjectedBlocks(8);
  const recent = useRecentBlocks(settings.recentBlocks);
  const [selected, setSelected] = useState<number | null>(null);
  const selectedBlock = selected !== null ? projected.blocks.find((b) => b.index === selected) : undefined;
  const blockMaxCost = projected.summary?.state.blockMaxCost ?? CHIA.BLOCK_MAX_COST;

  return (
    <section aria-label="Blocks" className="rounded-card border border-border/60 bg-bg-elevated/60">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3 px-4 pb-4 pt-4">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-fg-faint">Projected · next blocks</span>
          <div className="flex justify-end overflow-x-auto overscroll-x-contain pb-1" style={{ scrollbarWidth: "thin" }}>
            <ProjectedBlocks blocks={projected.blocks} loading={projected.isLoading} selected={selected} onSelect={setSelected} />
          </div>
        </div>
        <div aria-hidden="true" className="mb-1 h-[164px] w-0 border-l-2 border-dashed border-fg-faint/70" />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">Confirmed · recent transaction blocks</span>
          <div className="overflow-x-auto overscroll-x-contain pb-1" style={{ scrollbarWidth: "thin" }}>
            <RecentBlocks data={recent.data} loading={recent.isLoading} blockMaxCost={blockMaxCost} />
          </div>
        </div>
      </div>
      {selectedBlock ? (
        <div className="px-4 pb-4">
          <ProjectedBlockDetails block={selectedBlock} onClose={() => setSelected(null)} />
        </div>
      ) : null}
    </section>
  );
}
