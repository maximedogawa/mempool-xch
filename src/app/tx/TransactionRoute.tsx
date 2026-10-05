"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { useT } from "@/shared/i18n/useT";
import { EmptyState } from "@/shared/ui";
import { TransactionPage } from "@/widgets/tx/TransactionPage";
import appNs from "@/shared/i18n/messages/en/app";

export function TransactionRoute() {
  const t = useT(appNs);
  const raw = useDetailId("tx") ?? "";
  const id = normaliseId32(raw);
  if (raw && !id) {
    return (
      <EmptyState
        tone="danger"
        title={t("invalidTx.title")}
        description={t("invalidTx.description")}
      />
    );
  }
  return <TransactionPage id={id} />;
}
