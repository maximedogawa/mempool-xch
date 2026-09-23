"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { useT } from "@/shared/i18n/useT";
import { EmptyState } from "@/shared/ui";
import { BlockDetails } from "@/widgets/block/BlockDetails";
import appNs from "@/shared/i18n/messages/en/app";

export function BlockPageClient() {
  const t = useT(appNs);
  const id = useDetailId("block");
  if (!id) return <EmptyState title={t("noBlock.title")} description={t("noBlock.description")} />;
  return <BlockDetails id={id} />;
}
