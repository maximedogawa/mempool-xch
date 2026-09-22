"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { useT } from "@/shared/i18n/useT";
import { EmptyState } from "@/shared/ui";
import { BlockDetails } from "@/widgets/block/BlockDetails";

export function BlockPageClient() {
  const t = useT("app");
  const id = useDetailId("block");
  if (!id) return <EmptyState title={t("noBlock.title")} description={t("noBlock.description")} />;
  return <BlockDetails id={id} />;
}
