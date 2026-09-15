"use client";

import { useDetailId } from "@/shared/hooks/useDetailId";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { EmptyState } from "@/shared/ui";
import { TransactionPage } from "@/widgets/tx/TransactionPage";

export function TransactionRoute() {
  const raw = useDetailId("tx") ?? "";
  const id = normaliseId32(raw);
  if (raw && !id) {
    return <EmptyState tone="danger" title="Invalid transaction id" description="A transaction (spend bundle) id is 32 bytes of hex, with or without a 0x prefix." />;
  }
  return <TransactionPage id={id} />;
}
