"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { EmptyState } from "@/shared/ui";
import { BlockDetails } from "@/widgets/block/BlockDetails";

export function BlockPageClient() {
  const id = useDetailId("block");
  if (!id) return <EmptyState title="No block selected" description="Search for a block height or header hash." />;
  return <BlockDetails id={id} />;
}
