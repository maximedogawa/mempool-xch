"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { useT } from "@/shared/i18n/useT";
import { EmptyState } from "@/shared/ui";
import { TransactionPage } from "@/widgets/tx/TransactionPage";

export function TransactionRoute() {
  const t = useT("app");
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
